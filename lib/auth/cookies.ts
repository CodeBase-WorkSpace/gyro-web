import {AuthResponse} from "@/lib/auth/types";
import {cookies} from "next/headers";
import {ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE} from "@/lib/auth/constants";

const isProduction = process.env.NODE_ENV === "production";

export async function setAuthCookies(auth: AuthResponse) {
    const cookieStore = await cookies();

    cookieStore.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
        // httpOnly prevents JavaScript from reading the token. This is a critical security measure to mitigate XSS attacks.
        httpOnly: true,
        secure: isProduction,
        // lax: Cookies are sent on same-site requests and top-level navigation to the site, but not on cross-site subrequests (e.g., loading images or iframes from another site).
        sameSite: "lax",
        path: "/",
        maxAge: auth.accessExpiresInSeconds ?? 15 * 60,
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    });
}

export async function clearAuthCookies() {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getAccessToken() {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken() {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}
