import { getSession } from "@/lib/session";

// GET /api/me — echo the caller's verified identity, mirroring the reference
// stack's api-backend /api/me. Useful for confirming that login worked and that
// realm roles arrived.
//
// Returns the masked `uid`, never the Keycloak `sub` — the sub is not even in
// the session to leak.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.uid) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  return Response.json({
    uid: session.uid,
    username: session.username,
    roles: session.roles ?? [],
    is_naieve_admin: (session.roles ?? []).includes("naieve_admin"),
  });
}
