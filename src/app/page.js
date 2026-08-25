import NAIEve from "@/components/NAIEve";
import SignIn from "@/components/SignIn";
import SessionBar from "@/components/SessionBar";
import { getSession } from "@/lib/session";

// Reads the session cookie, so it must never be prerendered.
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const session = await getSession();

  if (!session?.uid) {
    const params = await searchParams;
    return <SignIn error={params?.auth_error} />;
  }

  return (
    <>
      <SessionBar username={session.username} />
      <NAIEve />
    </>
  );
}
