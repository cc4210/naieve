import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";

// Server-side session in an encrypted httpOnly cookie. Encrypted rather than
// merely signed because it carries the id_token (needed for RP-initiated
// logout), which has no business being readable in the browser.
//
// The Keycloak `sub` is deliberately NOT in here — the callback trades it for
// the app_user UUID and only the UUID travels.

const SESSION_COOKIE = "naieve_session";
const FLOW_COOKIE = "naieve_oidc_flow";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8h
const FLOW_MAX_AGE = 60 * 10; // one login round trip

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  // 'dir' with A256GCM needs exactly 32 bytes.
  return createHash("sha256").update(secret).digest();
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    // 'lax' so the cookie survives the top-level redirect back from Keycloak.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

async function seal(payload, maxAge) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .encrypt(key());
}

async function unseal(value) {
  try {
    const { payload } = await jwtDecrypt(value, key());
    return payload;
  } catch {
    // Tampered, expired, or signed with a rotated AUTH_SECRET — treat as absent.
    return null;
  }
}

// ── session ──────────────────────────────────────────────────────────────────

/** `{ uid, username, roles, idToken }` or null. */
export async function getSession() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  return raw ? unseal(raw) : null;
}

export async function setSession(data) {
  (await cookies()).set(
    SESSION_COOKIE,
    await seal(data, SESSION_MAX_AGE),
    cookieOptions(SESSION_MAX_AGE)
  );
}

export async function clearSession() {
  (await cookies()).set(SESSION_COOKIE, "", cookieOptions(0));
}

export function hasRole(session, role) {
  return Array.isArray(session?.roles) && session.roles.includes(role);
}

// ── in-flight login state (PKCE verifier, state, nonce) ──────────────────────

export async function setFlow(data) {
  (await cookies()).set(
    FLOW_COOKIE,
    await seal(data, FLOW_MAX_AGE),
    cookieOptions(FLOW_MAX_AGE)
  );
}

export async function getFlow() {
  const raw = (await cookies()).get(FLOW_COOKIE)?.value;
  return raw ? unseal(raw) : null;
}

export async function clearFlow() {
  (await cookies()).set(FLOW_COOKIE, "", cookieOptions(0));
}
