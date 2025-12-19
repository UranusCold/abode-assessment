"use client"

import * as React from "react"

import { Example, ExampleWrapper } from "@/components/example"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type GenerateTargetResponse =
  | { targetName: string }
  | { error: string }

type NameVerificationResponse =
  | { match: boolean; confidence: number; reason: string }
  | { error: string }

type NameTestRunResult = {
  startedAt: string
  completedAt: string
  total: number
  passed: number
  failed: number
  rows: Array<{
    id: number
    targetName: string
    candidateName: string
    expectedMatch: boolean
    actualMatch: boolean | null
    confidence: number | null
    reason: string | null
    pass: boolean
    error: string | null
  }>
}

export function AbodeMoneyAssessment() {
  const [prompt, setPrompt] = React.useState(
    "Please generate a random Arabic sounding name with an Al and ibn both involved. The name shouldn't be longer than 5 words."
  )
  const [latestTargetName, setLatestTargetName] = React.useState<string | null>(
    null
  )
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generateError, setGenerateError] = React.useState<string | null>(null)

  const [candidateName, setCandidateName] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [verifyError, setVerifyError] = React.useState<string | null>(null)
  const [verificationResult, setVerificationResult] = React.useState<{
    match: boolean
    confidence: number
    reason: string
  } | null>(null)

  const [isRunningTests, setIsRunningTests] = React.useState(false)
  const [testError, setTestError] = React.useState<string | null>(null)
  const [testRun, setTestRun] = React.useState<NameTestRunResult | null>(null)

  async function handleGenerateTarget() {
    setIsGenerating(true)
    setGenerateError(null)
    setVerificationResult(null)
    setVerifyError(null)

    try {
      const res = await fetch("/api/generate-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const data = (await res.json()) as GenerateTargetResponse
      if (!res.ok) {
        throw new Error("error" in data ? data.error : "Failed to generate.")
      }

      setLatestTargetName(data.targetName.trim())
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleVerifyCandidate() {
    setIsVerifying(true)
    setVerifyError(null)
    setVerificationResult(null)

    if (!latestTargetName?.trim()) {
      setIsVerifying(false)
      setVerifyError("Generate a target name first.")
      return
    }

    try {
      const res = await fetch("/api/verify-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: latestTargetName,
          candidateName,
        }),
      })

      const data = (await res.json()) as NameVerificationResponse
      if (!res.ok) {
        throw new Error("error" in data ? data.error : "Failed to verify.")
      }

      setVerificationResult({
        match: data.match,
        confidence: data.confidence,
        reason: data.reason,
      })
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleRunTests() {
    setIsRunningTests(true)
    setTestError(null)
    setTestRun(null)

    try {
      const res = await fetch("/api/run-tests", { method: "POST" })
      const data = (await res.json()) as NameTestRunResult | { error: string }
      if (!res.ok) {
        throw new Error("error" in data ? data.error : "Failed to run tests.")
      }
      setTestRun(data as NameTestRunResult)
    } catch (err) {
      setTestError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRunningTests(false)
    }
  }

  return (
    <ExampleWrapper className="content-start items-start md:grid-cols-1">
      <div className="flex flex-col gap-1">
        <div className="text-foreground px-1.5 pt-2 text-lg font-medium">
          abode money assessment
        </div>
        <div className="text-muted-foreground px-1.5 text-xs">
          Generate a target name from a prompt, then verify candidate names against
          the latest target. Run the provided test suite to see pass/fail.
        </div>
      </div>

      <Example title="Target Name Generator">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Target Name Generator</CardTitle>
            <CardDescription>
              Provide a free-form prompt and generate exactly one target name string.
              Generating again updates what “latest” means.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="target-prompt">Prompt</FieldLabel>
                <Textarea
                  id="target-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Generate a random name with..."
                />
                <FieldDescription>
                  This prompt is sent to the generator LLM (server-side). The latest
                  generated target name is kept in client state.
                </FieldDescription>
              </Field>

              {generateError && (
                <div className="text-destructive text-xs">{generateError}</div>
              )}

              {latestTargetName && (
                <Field>
                  <FieldLabel htmlFor="latest-target">Latest target name</FieldLabel>
                  <Input id="latest-target" value={latestTargetName} readOnly />
                </Field>
              )}
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              onClick={handleGenerateTarget}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating
                ? "Generating..."
                : latestTargetName
                  ? "Regenerate"
                  : "Generate"}
            </Button>
          </CardFooter>
        </Card>
      </Example>

      <Example title="Name Verifier">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Name Verifier</CardTitle>
            <CardDescription>
              Verify a candidate name against the latest generated target name. The
              verifier only receives the latest target name string (black-box
              generator).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="candidate-name">Candidate name</FieldLabel>
                <Input
                  id="candidate-name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter a candidate name"
                />
                <FieldDescription>
                  {latestTargetName
                    ? `Latest target: ${latestTargetName}`
                    : "No target generated yet."}
                </FieldDescription>
              </Field>

              {verifyError && (
                <div className="text-destructive text-xs">{verifyError}</div>
              )}

              {verificationResult && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={verificationResult.match ? "default" : "secondary"}>
                      {verificationResult.match ? "Match" : "No Match"}
                    </Badge>
                    <Badge variant="secondary">
                      Confidence: {verificationResult.confidence.toFixed(1)} / 10
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {verificationResult.reason}
                  </div>
                </div>
              )}
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              onClick={handleVerifyCandidate}
              disabled={
                isVerifying ||
                !candidateName.trim() ||
                !latestTargetName?.trim()
              }
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </CardFooter>
        </Card>
      </Example>

      <Example title="Test Runner">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Test Runner</CardTitle>
            <CardDescription>
              Runs the provided (target, candidate, expected) cases and compares the
              verifier’s result against expected match/no-match. This calls the
              verifier LLM once per row.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testError && <div className="text-destructive text-xs">{testError}</div>}

            {testRun && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={testRun.failed === 0 ? "default" : "secondary"}>
                    {testRun.failed === 0 ? "All Passed" : "Has Failures"}
                  </Badge>
                  <Badge variant="secondary">
                    Passed {testRun.passed}/{testRun.total}
                  </Badge>
                  <Badge variant="secondary">Failed {testRun.failed}</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Conf</TableHead>
                      <TableHead>Pass</TableHead>
                      <TableHead>Reason / Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testRun.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {row.targetName}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {row.candidateName}
                        </TableCell>
                        <TableCell>{row.expectedMatch ? "Match" : "No Match"}</TableCell>
                        <TableCell>
                          {row.actualMatch === null
                            ? "—"
                            : row.actualMatch
                              ? "Match"
                              : "No Match"}
                        </TableCell>
                        <TableCell>
                          {row.confidence === null ? "—" : row.confidence.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.pass ? "default" : "secondary"}>
                            {row.pass ? "PASS" : "FAIL"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate">
                          {row.error ?? row.reason ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleRunTests} disabled={isRunningTests}>
              {isRunningTests ? "Running..." : "Run tests"}
            </Button>
          </CardFooter>
        </Card>
      </Example>
    </ExampleWrapper>
  )
}


