import { sql } from "./db";

/**
 * Trade a Keycloak `sub` for this app's opaque user id, creating the row on
 * first login. Called once per login from the OIDC callback.
 *
 * This upsert is the entire "sync with Keycloak" mechanism — no directory sync,
 * no SCIM, no shadow user table kept in step. Because the join key is the
 * immutable `sub`, a username or email change in Keycloak never orphans data.
 *
 * The returned UUID is what every log row stores and what any export exposes.
 * The `sub` itself must not travel any further than this function.
 */
export async function upsertUser(keycloakSub) {
  const { rows } = await sql`
    INSERT INTO app_user (keycloak_sub)
    VALUES (${keycloakSub})
    ON CONFLICT (keycloak_sub) DO UPDATE SET last_login_at = NOW()
    RETURNING id
  `;
  return rows[0].id;
}
