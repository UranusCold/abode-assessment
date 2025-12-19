import "server-only"

import { verifyCandidateName } from "@/lib/name-verifier"
import { nameTestCases } from "@/lib/test-names"

export type NameTestRunRow = {
  id: number
  targetName: string
  candidateName: string
  expectedMatch: boolean
  actualMatch: boolean | null
  confidence: number | null
  reason: string | null
  pass: boolean
  error: string | null
}

export type NameTestRunResult = {
  startedAt: string
  completedAt: string
  total: number
  passed: number
  failed: number
  rows: NameTestRunRow[]
}

export async function runNameTests(): Promise<NameTestRunResult> {
  const startedAt = new Date().toISOString()
  const rows: NameTestRunRow[] = []

  for (const testCase of nameTestCases) {
    try {
      const verdict = await verifyCandidateName({
        targetName: testCase.targetName,
        candidateName: testCase.candidateName,
      })
      const actualMatch = verdict.match
      const pass = actualMatch === testCase.expectedMatch

      rows.push({
        id: testCase.id,
        targetName: testCase.targetName,
        candidateName: testCase.candidateName,
        expectedMatch: testCase.expectedMatch,
        actualMatch,
        confidence: verdict.confidence,
        reason: verdict.reason,
        pass,
        error: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      rows.push({
        id: testCase.id,
        targetName: testCase.targetName,
        candidateName: testCase.candidateName,
        expectedMatch: testCase.expectedMatch,
        actualMatch: null,
        confidence: null,
        reason: null,
        pass: false,
        error: message,
      })
    }
  }

  const passed = rows.filter((r) => r.pass).length
  const failed = rows.length - passed
  const completedAt = new Date().toISOString()

  return {
    startedAt,
    completedAt,
    total: rows.length,
    passed,
    failed,
    rows,
  }
}


