import assert from "node:assert/strict";
import test from "node:test";

import {exportSPKI, generateKeyPair, SignJWT} from "jose";
import type {CryptoKey as JoseCryptoKey} from "jose";

import {proxy} from "../proxy";
import {NextRequest} from "next/server";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

const testKeys = generateKeyPair("ES256");
const otherKeys = generateKeyPair("ES256");

async function signAccessToken(options: {
  type?: string;
  role?: string;
  issuer?: string;
  audience?: string;
  subject?: string;
  expiresIn?: string;
  signWith?: JoseCryptoKey | Uint8Array;
  algorithm?: string;
} = {}) {
  const {
    type = "access",
    role = "USER",
    issuer = "gyro-api",
    audience = "gyro",
    subject = "7c4d85fb-8f86-4b2a-bab2-03f5e364c601",
    expiresIn = "15m",
    signWith,
    algorithm = "ES256"
  } = options;

  const key = signWith ?? (await testKeys).privateKey;
  return new SignJWT({type, role})
    .setProtectedHeader({alg: algorithm})
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

async function withLocalJwtVerification<T>(run: () => Promise<T>): Promise<T> {
  process.env.JWT_PUBLIC_KEY = await exportSPKI((await testKeys).publicKey);
  try {
    return await run();
  } finally {
    delete process.env.JWT_PUBLIC_KEY;
  }
}

async function expectLoginRedirect(token: string) {
  const request = new NextRequest("http://localhost/profile", {
    headers: {cookie: `gyro_access_token=${token}`}
  });
  const response = await proxy(request);
  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") ?? "", /\/auth\/login/);
}

const validSessionResponse = {
  id: "7c4d85fb-8f86-4b2a-bab2-03f5e364c601",
  email: "user@example.com",
  phoneNumber: null,
  role: "USER",
  status: "ACTIVE",
  emailVerificationStatus: "VERIFIED",
  phoneVerificationStatus: "UNVERIFIED",
  createdAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z",
  displayName: "Gyro User",
  timezone: "Asia/Tehran",
  locale: "fa-IR"
};

const adminSessionResponse = {
  ...validSessionResponse,
  role: "ADMIN"
};

const refreshedAuthResponse = {
  accessToken: "new-access-token",
  refreshToken: "new-refresh-token",
  accessExpiresInSeconds: 900
};

test("proxy redirects protected routes when the backend rejects the access token", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    }) as Response;

  try {
    const request = new NextRequest("http://localhost/profile", {
      headers: {
        cookie: "gyro_access_token=stale-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/auth\/login/);
    assert.match(response.headers.get("location") ?? "", /next=%2Fprofile/);
    assert.match(response.headers.get("location") ?? "", /expired=1/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy preserves the selected dashboard day when it redirects to login", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }) as Response;

  try {
    const response = await proxy(new NextRequest("http://localhost/dashboard?date=2026-02-26", {
      headers: { cookie: "gyro_access_token=stale-token" },
    }));

    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /next=%2Fdashboard%3Fdate%3D2026-02-26/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy refreshes protected routes when access cookie is missing but refresh cookie is valid", async () => {
  const originalFetch = global.fetch;
  const requestedUrls: string[] = [];
  const authorizationHeaders: string[] = [];

  global.fetch = async (input, init) => {
    const url = String(input);
    requestedUrls.push(url);
    authorizationHeaders.push(new Headers(init?.headers).get("Authorization") ?? "");

    if (url.endsWith("/auth/refresh")) {
      return new Response(JSON.stringify(refreshedAuthResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }) as Response;
    }

    return new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }) as Response;
  };

  try {
    const request = new NextRequest("http://localhost/profile", {
      headers: {
        cookie: "gyro_refresh_token=valid-refresh-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 200);
    assert.equal(requestedUrls.some((url) => url.endsWith("/auth/refresh")), true);
    assert.equal(authorizationHeaders.includes("Bearer new-access-token"), true);
    assert.match(response.headers.get("set-cookie") ?? "", /gyro_access_token=new-access-token/);
    assert.match(response.headers.get("set-cookie") ?? "", /gyro_refresh_token=new-refresh-token/);
    assert.match(response.headers.get("x-middleware-request-cookie") ?? "", /gyro_access_token=new-access-token/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy refreshes protected routes when access cookie is stale and refresh cookie is valid", async () => {
  const originalFetch = global.fetch;
  let usersMeCalls = 0;

  global.fetch = async (input, init) => {
    const url = String(input);
    const authorization = new Headers(init?.headers).get("Authorization") ?? "";

    if (url.endsWith("/auth/refresh")) {
      return new Response(JSON.stringify(refreshedAuthResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }) as Response;
    }

    usersMeCalls += 1;

    if (authorization === "Bearer stale-token") {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }) as Response;
    }

    return new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }) as Response;
  };

  try {
    const request = new NextRequest("http://localhost/profile", {
      headers: {
        cookie: "gyro_access_token=stale-token; gyro_refresh_token=valid-refresh-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 200);
    assert.equal(usersMeCalls, 2);
    assert.match(response.headers.get("set-cookie") ?? "", /gyro_access_token=new-access-token/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy keeps authenticated users out of auth routes after backend validation", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }) as Response;

  try {
    const request = new NextRequest("http://localhost/auth/login", {
      headers: {
        cookie: "gyro_access_token=valid-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/dashboard$/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy moves app routes from the marketing domain to the app domain", async () => {
  const response = await proxy(new NextRequest("https://gyrohealth.ir/dashboard?date=2026-02-26", {
    headers: {host: "gyrohealth.ir"},
  }));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://app.gyrohealth.ir/dashboard?date=2026-02-26");
});

test("proxy moves auth routes from the marketing domain to the app domain", async () => {
  const response = await proxy(new NextRequest("https://gyrohealth.ir/auth/signup", {
    headers: {host: "gyrohealth.ir"},
  }));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://app.gyrohealth.ir/auth/signup");
});

test("proxy redirects the app host root to the dashboard surface", async () => {
  const response = await proxy(new NextRequest("https://app.gyrohealth.ir/", {
    headers: {host: "app.gyrohealth.ir"},
  }));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://app.gyrohealth.ir/dashboard");
});

test("proxy redirects the local app host root to the dashboard surface", async () => {
  const response = await proxy(new NextRequest("http://app.localhost:3002/", {
    headers: {host: "app.localhost:3002"},
  }));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://app.localhost:3002/dashboard");
});

test("proxy protects billing routes", async () => {
  const response = await proxy(new NextRequest("http://app.localhost:3002/profile/billing", {
    headers: {host: "app.localhost:3002"},
  }));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://app.localhost:3002/auth/login?next=%2Fprofile%2Fbilling");
});

test("proxy protects account recovery routes", async () => {
  const response = await proxy(new NextRequest("http://app.localhost:3002/account/recovery?state=ACCOUNT_STOPPED", {
    headers: {host: "app.localhost:3002"},
  }));

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "http://app.localhost:3002/auth/login?next=%2Faccount%2Frecovery%3Fstate%3DACCOUNT_STOPPED",
  );
});

test("proxy persists the profile locale in the PWA locale cookie", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({...validSessionResponse, locale: "en-US"}), {
      status: 200,
      headers: {"Content-Type": "application/json"}
    }) as Response;

  try {
    const request = new NextRequest("http://localhost/profile", {
      headers: {
        cookie: "gyro_access_token=valid-token; NEXT_LOCALE=fa-IR"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie") ?? "", /NEXT_LOCALE=en-US/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy returns not found for old admin subdomain requests", async () => {
  const originalFetch = global.fetch;
  let didCallBackend = false;
  global.fetch = async () => {
    didCallBackend = true;
    return new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }) as Response;
  };

  try {
    const request = new NextRequest("https://admin.gyrohealth.ir/", {
      headers: {
        host: "admin.gyrohealth.ir"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 404);
    assert.equal(response.headers.has("location"), false);
    assert.equal(didCallBackend, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy redirects non-admin users away from the app admin route", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }) as Response;

  try {
    const request = new NextRequest("http://app.localhost:3002/admin", {
      headers: {
        host: "app.localhost:3002",
        cookie: "gyro_access_token=user-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://app.localhost:3002/unauthorized");
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy allows admin users onto the app admin route", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify(adminSessionResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }) as Response;

  try {
    const request = new NextRequest("http://app.localhost:3002/admin", {
      headers: {
        host: "app.localhost:3002",
        cookie: "gyro_access_token=admin-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 200);
    assert.equal(response.headers.has("x-gyro-surface"), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy keeps non-admin users on the app host when they request admin routes", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }) as Response;

  try {
    const request = new NextRequest("http://localhost:3002/admin", {
      headers: {
        host: "localhost:3002",
        cookie: "gyro_access_token=user-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://localhost:3002/unauthorized");
  } finally {
    global.fetch = originalFetch;
  }
});

test("proxy verifies ES256 access tokens locally without calling the backend", async () => {
  await withLocalJwtVerification(async () => {
    const originalFetch = global.fetch;
    let backendCalls = 0;
    global.fetch = async () => {
      backendCalls += 1;
      return new Response(JSON.stringify(validSessionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }) as Response;
    };

    try {
      const request = new NextRequest("http://localhost/profile", {
        headers: {
          cookie: `gyro_access_token=${await signAccessToken()}`
        }
      });

      const response = await proxy(request);

      assert.equal(response.status, 200);
      assert.equal(backendCalls, 0);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test("proxy revalidates admin navigation with the backend", async () => {
  await withLocalJwtVerification(async () => {
    const originalFetch = global.fetch;
    let backendCalls = 0;
    global.fetch = async () => {
      backendCalls += 1;
      return new Response(JSON.stringify(adminSessionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }) as Response;
    };

    try {
      const request = new NextRequest("http://app.localhost:3002/admin", {
        headers: {
          host: "app.localhost:3002",
          cookie: `gyro_access_token=${await signAccessToken({role: "ADMIN"})}`
        }
      });

      const response = await proxy(request);

      assert.equal(response.status, 200);
      assert.equal(backendCalls, 1);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test("proxy redirects locally verified non-admin users away from admin routes", async () => {
  await withLocalJwtVerification(async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: {"Content-Type": "application/json"}
    }) as Response;

    try {
      const request = new NextRequest("http://app.localhost:3002/admin", {
        headers: {
          host: "app.localhost:3002",
          cookie: `gyro_access_token=${await signAccessToken({role: "USER"})}`
        }
      });

      const response = await proxy(request);

      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), "http://app.localhost:3002/unauthorized");
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test("proxy applies a backend admin-role revocation immediately", async () => {
  await withLocalJwtVerification(async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: {"Content-Type": "application/json"}
    }) as Response;

    try {
      const request = new NextRequest("http://app.localhost:3002/admin", {
        headers: {
          host: "app.localhost:3002",
          cookie: `gyro_access_token=${await signAccessToken({role: "ADMIN"})}`
        }
      });

      const response = await proxy(request);

      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), "http://app.localhost:3002/unauthorized");
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test("proxy keeps locally verified users out of auth routes", async () => {
  await withLocalJwtVerification(async () => {
    const request = new NextRequest("http://localhost/auth/login", {
      headers: {
        cookie: `gyro_access_token=${await signAccessToken()}`
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/dashboard$/);
  });
});

test("proxy falls back to the refresh flow when the access token is expired", async () => {
  await withLocalJwtVerification(async () => {
    const originalFetch = global.fetch;
    const requestedUrls: string[] = [];

    global.fetch = async (input) => {
      const url = String(input);
      requestedUrls.push(url);

      if (url.endsWith("/auth/refresh")) {
        return new Response(JSON.stringify(refreshedAuthResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }) as Response;
      }

      return new Response(JSON.stringify(validSessionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }) as Response;
    };

    try {
      const request = new NextRequest("http://localhost/profile", {
        headers: {
          cookie: `gyro_access_token=${await signAccessToken({expiresIn: "-2m"})}; gyro_refresh_token=valid-refresh-token`
        }
      });

      const response = await proxy(request);

      assert.equal(response.status, 200);
      assert.equal(requestedUrls.some((url) => url.endsWith("/auth/refresh")), true);
      assert.match(response.headers.get("set-cookie") ?? "", /gyro_access_token=new-access-token/);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test("proxy rejects tokens signed with a different EC key", async () => {
  await withLocalJwtVerification(async () => {
    await expectLoginRedirect(await signAccessToken({signWith: (await otherKeys).privateKey}));
  });
});

test("proxy rejects refresh-type tokens presented as access tokens", async () => {
  await withLocalJwtVerification(async () => {
    await expectLoginRedirect(await signAccessToken({type: "refresh"}));
  });
});

test("proxy rejects tokens with the wrong issuer or audience", async () => {
  await withLocalJwtVerification(async () => {
    await expectLoginRedirect(await signAccessToken({issuer: "other-api"}));
    await expectLoginRedirect(await signAccessToken({audience: "other-app"}));
  });
});

test("proxy rejects HS256, unknown-role, and non-UUID access tokens", async () => {
  await withLocalJwtVerification(async () => {
    await expectLoginRedirect(await signAccessToken({
      algorithm: "HS256",
      signWith: new TextEncoder().encode("0123456789abcdef0123456789abcdef"),
    }));
    await expectLoginRedirect(await signAccessToken({role: "SUPERUSER"}));
    await expectLoginRedirect(await signAccessToken({subject: "user-123"}));
  });
});

test("proxy falls back to backend validation when JWT_PUBLIC_KEY is malformed", async () => {
  process.env.JWT_PUBLIC_KEY = "not-a-pem-key";
  const originalFetch = global.fetch;
  let backendCalls = 0;
  global.fetch = async () => {
    backendCalls += 1;
    return new Response(JSON.stringify(validSessionResponse), {
      status: 200,
      headers: {"Content-Type": "application/json"}
    }) as Response;
  };

  try {
    const request = new NextRequest("http://localhost/profile", {
      headers: {cookie: "gyro_access_token=whatever-token"}
    });
    const response = await proxy(request);
    assert.equal(response.status, 200);
    assert.equal(backendCalls, 1);
  } finally {
    global.fetch = originalFetch;
    delete process.env.JWT_PUBLIC_KEY;
  }
});

test("proxy keeps app host admin routes on the app host for admins", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify(adminSessionResponse), {
      status: 200,
      headers: {"Content-Type": "application/json"}
    }) as Response;

  try {
    const request = new NextRequest("https://app.gyrohealth.ir/admin", {
      headers: {
        host: "app.gyrohealth.ir",
        cookie: "gyro_access_token=admin-token"
      }
    });

    const response = await proxy(request);

    assert.equal(response.status, 200);
    assert.equal(response.headers.has("location"), false);
  } finally {
    global.fetch = originalFetch;
  }
});
