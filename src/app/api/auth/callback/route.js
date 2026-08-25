import {
  client,
  getOidcConfig,
  callbackUrl,
  appBaseUrl,
  realmRolesFromAccessToken,
} from "@/lib/oidc";
import { getFlow, clearFlow, setSession } from "@/lib/session";
import { upsertUser } from "@/lib/users";

// GET /api/auth/callback — exchange the code, mask the sub, start the session.
export const dynamic = "force-dynamic";

function back(reason) {
  const url = new URL("/", appBaseUrl());
  if (reason) url.searchParams.set("auth_error", reason);
  return Response.redirect(url.href, 302);
}

export async function GET(req) {
  const flow = await getFlow();
  if (!flow) {
    // Cookie expired, or someone hit the callback directly.
    return back("expired");
  }

  let session;
  try {
    const config = await getOidcConfig();

    // Rebuild the current URL from APP_BASE_URL rather than trusting req.url:
    // behind the ALB the inbound Host is the internal target, which would not
    // match the redirect_uri Keycloak validated against.
    const current = new URL(callbackUrl());
    current.search = new URL(req.url).search;

    const tokens = await client.authorizationCodeGrant(config, current, {
      pkceCodeVerifier: flow.codeVerifier,
      expectedState: flow.state,
      expectedNonce: flow.nonce,
    });

    const claims = tokens.claims();

    // The only place the sub is ever read. It is traded for the UUID here and
    // does not enter the session cookie.
    const uid = await upsertUser(claims.sub);

    session = {
      uid,
      username: claims.preferred_username ?? null,
      roles: realmRolesFromAccessToken(tokens.access_token),
      // Kept solely as the id_token_hint for RP-initiated logout.
      idToken: tokens.id_token,
    };
  } catch (err) {
    console.error("OIDC callback failed:", err.message);
    await clearFlow();
    return back("failed");
  }

  await clearFlow();
  await setSession(session);
  return Response.redirect(new URL("/", appBaseUrl()).href, 302);
}
