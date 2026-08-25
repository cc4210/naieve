import { client, getOidcConfig, callbackUrl } from "@/lib/oidc";
import { setFlow } from "@/lib/session";

// GET /api/auth/login — start Authorization Code + PKCE.
//
// PKCE is defence in depth here: this is a confidential client with a secret,
// but the reference stack requires PKCE on both client types.
export const dynamic = "force-dynamic";

export async function GET() {
  let config;
  try {
    config = await getOidcConfig();
  } catch (err) {
    console.error("OIDC discovery failed:", err.message);
    return new Response(
      `Cannot reach the identity provider: ${err.message}`,
      { status: 503, headers: { "Content-Type": "text/plain" } }
    );
  }

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const authUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl(),
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  // Verifier/state/nonce have to survive the round trip to Keycloak; a
  // short-lived encrypted cookie is the store.
  await setFlow({ state, nonce, codeVerifier });

  return Response.redirect(authUrl.href, 302);
}
