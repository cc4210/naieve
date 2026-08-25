// GET /api/health — ALB target group health check.
//
// Deliberately does NOT touch the database: the ALB uses this to decide whether
// to keep the task in service, and a transient RDS blip should not cause a
// rolling replacement of otherwise-healthy tasks. Dependency checks belong in
// /smoketest, which chimney/hound polls.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
