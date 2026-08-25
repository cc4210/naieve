import { sql } from "@/lib/db";

// GET /smoketest — dependency checks for chimney/hound.
//
// Output mirrors django-smoketest's plaintext format (and its JSON variant when
// Accept: application/json) so the existing monitoring can read it unchanged:
// "PASS"/"FAIL" on line one, 200 on pass and 500 on failure.
export const dynamic = "force-dynamic";

async function checkDatabase() {
  await sql`SELECT 1`;
}

async function checkAnthropicKey() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
}

const TESTS = {
  database: checkDatabase,
  anthropic_key: checkAnthropicKey,
};

function plaintext({ status, run, passed, failed, errored, ms, errors }) {
  return `${status}
test classes: 1
tests run: ${run}
tests passed: ${passed}
tests failed: ${failed}
tests errored: ${errored}
time: ${ms.toFixed(6)}ms

${errors.join("\n\n")}
`;
}

export async function GET(req) {
  const start = Date.now();
  const errors = [];

  for (const [name, test] of Object.entries(TESTS)) {
    try {
      await test();
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }

  const run = Object.keys(TESTS).length;
  const errored = errors.length;
  const summary = {
    status: errored === 0 ? "PASS" : "FAIL",
    run,
    passed: run - errored,
    failed: 0, // a thrown check counts as errored, matching django-smoketest
    errored,
    ms: Date.now() - start,
    errors,
  };
  const httpStatus = errored === 0 ? 200 : 500;

  if ((req.headers.get("accept") || "").includes("application/json")) {
    return Response.json(
      {
        status: summary.status,
        test_classes: 1,
        tests_run: summary.run,
        tests_passed: summary.passed,
        tests_failed: summary.failed,
        tests_errored: summary.errored,
        failed_tests: [],
        errored_tests: errors,
        time: summary.ms,
      },
      { status: httpStatus }
    );
  }

  return new Response(plaintext(summary), {
    status: httpStatus,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
