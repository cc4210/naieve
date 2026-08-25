import { client, getOidcConfig, appBaseUrl } from "@/lib/oidc";
import { getSession, clearSession } from "@/lib/session";

// POST /api/auth/logout — clear our session, then end the Keycloak session too
// (RP-initiated logout). POST rather than GET so a stray link or prefetch can't
// log someone out.
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  await clearSession();

  if (session?.idToken) {
    try {
      const config = await getOidcConfig();
      const url = client.buildEndSessionUrl(config, {
        id_token_hint: session.idToken,
        post_logout_redirect_uri: appBaseUrl(),
      });
      return Response.redirect(url.href, 303);
    } catch (err) {
      // Our cookie is already gone, so a local logout still happened.
      console.error("RP-initiated logout unavailable:", err.message);
    }
  }

  return Response.redirect(appBaseUrl(), 303);
}
