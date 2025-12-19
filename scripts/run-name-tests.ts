import { runNameTests } from "../lib/run-name-tests"

async function main() {
  const result = await runNameTests()
  // eslint-disable-next-line no-console
  console.log(
    `Name verifier tests: ${result.passed}/${result.total} passed (${result.failed} failed)`
  )

  const rows = result.rows.map((r) => ({
    id: r.id,
    expected: r.expectedMatch ? "Match" : "No Match",
    actual:
      r.actualMatch === null ? "ERROR" : r.actualMatch ? "Match" : "No Match",
    confidence: r.confidence ?? null,
    pass: r.pass ? "PASS" : "FAIL",
    targetName: r.targetName,
    candidateName: r.candidateName,
    reasonOrError: r.error ?? r.reason ?? "",
  }))

  // eslint-disable-next-line no-console
  console.table(rows)

  if (result.failed > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


