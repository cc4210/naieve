import * as client from "openid-client";

// Standard OIDC via openid-client (OIDC-certified) — the Node counterpart to the
// reference stack's mozilla-django-oidc recipe. Nothing here is Keycloak-specific:
// swapping identity providers is a change to OIDC_ISSUER, not to code.

const globalForOidc = globalThis;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function appBaseUrl() {
  return required("APP_BASE_URL").replace(/\/$/, "");
}

export function callbackUrl() {
  return `${appBaseUrl()}/api/auth/callback`;
}

async function discover() {
  const issuer = new URL(required("OIDC_ISSUER"));

  // Local Keycloak runs on plain http; openid-client refuses that unless told
  // otherwise, and the allowance has to be in place for discovery itself.
  const insecure = issuer.protocol === "http:";
  if (insecure && process.env.NODE_ENV === "production") {
    throw new Error(
      `OIDC_ISSUER must use https in production (got ${issuer.origin})`
    );
  }

  return client.discovery(
    issuer,
    required("OIDC_CLIENT_ID"),
    undefined,
    client.ClientSecretPost(required("OIDC_CLIENT_SECRET")),
    insecure ? { execute: [client.allowInsecureRequests] } : undefined
  );
}

/**
 * Discovery result, cached in-process. openid-client refetches JWKS on its own
 * when it sees an unknown key id, so Keycloak key rotation needs no restart.
 */
export async function getOidcConfig() {
  if (globalForOidc.__naieveOidc) {
    const cached = await globalForOidc.__naieveOidc;
    // The cache lives on globalThis so it survives Next's dev hot reload — but
    // hot reload also re-instantiates the openid-client module, which changes
    // the identity of the Configuration class. A Configuration built by the
    // previous module instance then fails the library's own instanceof check
    // ("config must be an instance of Configuration"). Re-discover when that
    // has happened. Production has no HMR, so this branch never fires there.
    if (cached instanceof client.Configuration) return cached;
    globalForOidc.__naieveOidc = undefined;
  }

  globalForOidc.__naieveOidc = discover().catch((err) => {
    // Never cache a rejection — Keycloak may simply not be up yet.
    globalForOidc.__naieveOidc = undefined;
    throw err;
  });
  return globalForOidc.__naieveOidc;
}

/**
 * Realm roles live in the ACCESS token under `realm_access.roles` — not in the
 * ID token and not in userinfo. Decoding without verifying is safe here for the
 * same reason the reference stack's portal/auth.py does it: this token came
 * straight back from Keycloak over the authenticated back channel, and
 * openid-client already validated the exchange. It is never a client-supplied
 * value.
 */
export function realmRolesFromAccessToken(accessToken) {
  try {
    let part = accessToken.split(".")[1];
    part += "=".repeat((4 - (part.length % 4)) % 4);
    const claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return claims?.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

export { client };
