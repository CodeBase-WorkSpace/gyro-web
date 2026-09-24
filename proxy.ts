import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";

import {hasJwtVerificationKey, verifyAccessToken} from "./lib/auth/access-token";
import {getMe, refreshSession} from "./lib/auth/api";
import {ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE} from "./lib/auth/constants";
import type {AuthResponse, MeResponse} from "./lib/auth/types";
import {localeCookieMaxAge, localeCookieName, normalizeLocale,} from "./lib/i18n/config";

const APP_SUBDOMAIN = "app";
const PRODUCTION_MARKETING_HOST = "gyrohealth.ir";
const PRODUCTION_APP_HOST = `${APP_SUBDOMAIN}.${PRODUCTION_MARKETING_HOST}`;
const LOGIN_PATH = "/auth/login";
const APP_HOME_PATH = "/dashboard";
const UNAUTHORIZED_PATH = "/unauthorized";
const isProduction = process.env.NODE_ENV === "production";

const AUTH_ROUTE_PREFIXES = [
  "/auth",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password"
];

const PROTECTED_ROUTE_PREFIXES = [
  "/account",
  "/profile",
  "/foods",
  "/meals",
  "/diary",
  "/goals",
  "/progress",
  "/settings"
];

function splitHost(host: string) {
  const [hostname, port] = host.toLowerCase().split(":");
  return { hostname, port };
}

function isAdminHost(host: string) {
  const { hostname } = splitHost(host);
  return hostname === "admin.localhost" || hostname.startsWith("admin.");
}

function isProductionMarketingHost(host: string) {
  const { hostname } = splitHost(host);
  return hostname === PRODUCTION_MARKETING_HOST || hostname === `www.${PRODUCTION_MARKETING_HOST}`;
}

function isAppHost(host: string) {
  const { hostname } = splitHost(host);
  return hostname === PRODUCTION_APP_HOST || hostname === "app.localhost";
}

function withHostPort(hostname: string, originalHost: string) {
  const { port } = splitHost(originalHost);
  return port ? `${hostname}:${port}` : hostname;
}

function appHostFor(host: string) {
  const { hostname } = splitHost(host);
  if (hostname === PRODUCTION_MARKETING_HOST || hostname === `www.${PRODUCTION_MARKETING_HOST}`) {
    return withHostPort(PRODUCTION_APP_HOST, host);
  }

  const appHost = hostname === "app.localhost" ? "app.localhost" : hostname;
  return withHostPort(appHost, host);
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isProtectedRoute(pathname: string) {
  return pathname === APP_HOME_PATH ||
    pathname.startsWith(`${APP_HOME_PATH}/`) ||
    PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = LOGIN_PATH;
  redirectUrl.search = "";

  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (requestedPath !== APP_HOME_PATH) {
    redirectUrl.searchParams.set("next", requestedPath);
  }

  if (request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    redirectUrl.searchParams.set("expired", "1");
  }

  return NextResponse.redirect(redirectUrl);
}

function redirectToHome(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = APP_HOME_PATH;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

function redirectToAppHost(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.host = appHostFor(request.headers.get("host") ?? "");
  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  const requestHost = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const isAdminSurface = isAdminHost(requestHost);
  const isAppSurface = isAppHost(requestHost);
  const isMarketingSurface = isProductionMarketingHost(requestHost);

  if (isAdminSurface) {
    return new NextResponse("Not Found", {status: 404});
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const session = await resolveProxySession(accessToken, refreshToken, isAdminRoute(pathname));

  if (isMarketingSurface && (isAuthRoute(pathname) || isProtectedRoute(pathname) || isAdminRoute(pathname))) {
    return withRefreshedAuthCookies(redirectToAppHost(request), session.isAuthenticated ? session.refreshedAuth : undefined, session.isAuthenticated ? session.locale : undefined);
  }

  if (isAppSurface && pathname === "/") {
    return withRefreshedAuthCookies(
      redirectToHome(request),
      session.isAuthenticated ? session.refreshedAuth : undefined,
      session.isAuthenticated ? session.locale : undefined,
    );
  }

  if (isAuthRoute(pathname)) {
    return session.isAuthenticated
      ? withRefreshedAuthCookies(redirectToHome(request), session.refreshedAuth, session.locale)
      : NextResponse.next();
  }

  if (isProtectedRoute(pathname) && !session.isAuthenticated) {
    return withClearedAuthCookies(redirectToLogin(request), session.clearAuthCookies);
  }

  const refreshedAuth = session.isAuthenticated ? session.refreshedAuth : undefined;

  if (isAdminRoute(pathname)) {
    if (!session.isAuthenticated) {
      return withClearedAuthCookies(redirectToLogin(request), session.clearAuthCookies);
    }

    if (session.role !== "ADMIN") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = UNAUTHORIZED_PATH;
      redirectUrl.search = "";
      return withRefreshedAuthCookies(NextResponse.redirect(redirectUrl), session.refreshedAuth, session.locale);
    }

    return nextWithRefreshedAuth(request, refreshedAuth, session.locale);
  }

  return nextWithRefreshedAuth(request, refreshedAuth, session.isAuthenticated ? session.locale : undefined);
}

type ProxySession =
  | { isAuthenticated: false; clearAuthCookies?: boolean }
  | { isAuthenticated: true; role: MeResponse["role"]; locale?: MeResponse["locale"]; refreshedAuth?: AuthResponse };

async function resolveProxySession(
  accessToken?: string,
  refreshToken?: string,
  requireBackendValidation = false,
): Promise<ProxySession> {
  if (!accessToken) {
    return refreshProxySession(refreshToken);
  }

  if (hasJwtVerificationKey()) {
    const verification = await verifyAccessToken(accessToken);
    if (verification.status === "verified" && !requireBackendValidation) {
      return { isAuthenticated: true, role: verification.token.role };
    }
    if (verification.status === "invalid-token") {
      return refreshProxySession(refreshToken);
    }
    // A malformed key is a deployment issue, not evidence that the user token
    // is invalid. Preserve availability by using backend validation below.
  }

  // Without a usable public key, or for security-sensitive admin navigation,
  // retain backend validation so revocation and role changes take effect now.
  try {
    const user = await getMe(accessToken);
    return {
      isAuthenticated: true,
      role: user.role,
      locale: user.locale,
    };
  } catch {
    return refreshProxySession(refreshToken);
  }
}

async function refreshProxySession(refreshToken?: string): Promise<ProxySession> {
  if (!refreshToken) {
    return { isAuthenticated: false };
  }

  try {
    const auth = await refreshSession(refreshToken);
    const user = await getMe(auth.accessToken);

    return {
      isAuthenticated: true,
      role: user.role,
      locale: user.locale,
      refreshedAuth: auth,
    };
  } catch {
    return { isAuthenticated: false, clearAuthCookies: true };
  }
}

function nextWithRefreshedAuth(request: NextRequest, auth?: AuthResponse, locale?: string) {
  return withRefreshedAuthCookies(NextResponse.next(refreshedRequestInit(request, auth)), auth, locale);
}

function refreshedRequestInit(request: NextRequest, auth?: AuthResponse) {
  if (!auth) return undefined;

  const headers = new Headers(request.headers);
  headers.set("cookie", requestCookieHeaderWithAuth(request, auth));

  return {
    request: {
      headers,
    },
  };
}

function requestCookieHeaderWithAuth(request: NextRequest, auth: AuthResponse) {
  const cookiePairs = new Map<string, string>();

  for (const cookie of request.cookies.getAll()) {
    cookiePairs.set(cookie.name, cookie.value);
  }

  cookiePairs.set(ACCESS_TOKEN_COOKIE, auth.accessToken);
  cookiePairs.set(REFRESH_TOKEN_COOKIE, auth.refreshToken);

  return [...cookiePairs.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function withRefreshedAuthCookies(response: NextResponse, auth?: AuthResponse, locale?: string) {
  if (auth) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: auth.accessExpiresInSeconds ?? 15 * 60,
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const normalizedLocale = normalizeLocale(locale);
  if (normalizedLocale) {
    response.cookies.set(localeCookieName, normalizedLocale, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: localeCookieMaxAge,
    });
  }

  return response;
}

function withClearedAuthCookies(response: NextResponse, clear?: boolean) {
  if (!clear) return response;

  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|apple-touch-icon.png|icons/).*)"]
};
