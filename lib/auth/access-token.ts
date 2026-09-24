import {importSPKI, jwtVerify} from "jose";

// Mirrors the API token contract. The frontend receives only the ES256 public
// verification key; it never receives a key capable of minting Gyro tokens.
const JWT_ISSUER = process.env.JWT_ISSUER || "gyro-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "gyro";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type VerifiedAccessToken = {
  userId: string;
  role: "USER" | "ADMIN";
};

export type AccessTokenVerification =
  | {status: "verified"; token: VerifiedAccessToken}
  | {status: "invalid-token"}
  | {status: "key-unavailable"};

export function hasJwtVerificationKey(): boolean {
  return Boolean(process.env.JWT_PUBLIC_KEY?.trim());
}

let cachedKeyPem: string | undefined;
let cachedKey: Promise<CryptoKey> | null = null;
let warnedInvalidKey = false;

function publicKey(): Promise<CryptoKey> | null {
  const pem = process.env.JWT_PUBLIC_KEY?.trim();
  if (!pem) return null;

  const normalized = pem.replace(/\\n/g, "\n");
  if (!cachedKey || cachedKeyPem !== normalized) {
    cachedKeyPem = normalized;
    cachedKey = importSPKI(normalized, "ES256");
  }
  return cachedKey;
}

export async function verifyAccessToken(token: string): Promise<AccessTokenVerification> {
  const keyPromise = publicKey();
  if (!keyPromise) return {status: "key-unavailable"};

  let key: CryptoKey;
  try {
    key = await keyPromise;
  } catch {
    if (!warnedInvalidKey) {
      warnedInvalidKey = true;
      console.error(
        "JWT_PUBLIC_KEY is not a valid SPKI ES256 public key; falling back to backend session validation.",
      );
    }
    return {status: "key-unavailable"};
  }

  try {
    const {payload} = await jwtVerify(token, key, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["ES256"],
      clockTolerance: 30,
    });

    if (payload.type !== "access") return {status: "invalid-token"};
    if (typeof payload.sub !== "string" || !UUID_PATTERN.test(payload.sub)) {
      return {status: "invalid-token"};
    }
    if (payload.role !== "USER" && payload.role !== "ADMIN") {
      return {status: "invalid-token"};
    }

    return {
      status: "verified",
      token: {userId: payload.sub, role: payload.role},
    };
  } catch {
    return {status: "invalid-token"};
  }
}
