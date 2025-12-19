import "server-only"

import { createStructuredOutput } from "@/lib/structured-output"

export type NameVerificationResult = {
  match: boolean
  confidence: number // 0-10
  reason: string
}

const verificationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    match: { type: "boolean" },
    confidence: { type: "number", minimum: 0, maximum: 10 },
    reason: { type: "string" },
  },
  required: ["match", "confidence", "reason"],
} as const

export async function verifyCandidateName({
  targetName,
  candidateName,
}: {
  targetName: string
  candidateName: string
}): Promise<NameVerificationResult> {
  const target = targetName.trim()
  const candidate = candidateName.trim()

  if (!target) {
    throw new Error("No target name provided.")
  }
  if (!candidate) {
    throw new Error("Candidate name is required.")
  }

  const result = await createStructuredOutput<NameVerificationResult>({
    name: "NameVerification",
    description:
      "Whether the candidate matches the target, with confidence 0-10 and a short reason.",
    schema: verificationSchema,
    instructions: [
      "You are a deterministic name matching verifier.",
      "CRITICAL: You MUST decide using ONLY the provided target name string and candidate name string.",
      "Do NOT assume you can access the generator prompt or any generator context.",
      "",
      "Return ONLY valid JSON matching the schema (match, confidence 0-10, reason).",
      "Keep reason short (1 sentence).",
      "",
      "Guidelines (calibrated to the evaluation):",
      "- Ignore casing, punctuation, apostrophes, and hyphen vs space differences.",
      "- Allow minor typos/transpositions and common transliteration variants.",
      "- Allow common nickname pairs: Robert↔Bob, Elizabeth↔Liz.",
      "- Allow Mc/Mac variation (e.g., McDonald≈Macdonald).",
      "- Be careful with LAST-NAME suffix changes that can indicate a different surname (e.g., adding/removing a trailing 'i'/'y' or similar nisba-style ending). Do NOT treat those as matches by default.",
      "- DO NOT treat token order swaps as matches (e.g., 'Ali Hassan' ≠ 'Hassan Ali').",
      "- DO NOT over-match on shared last name when first name is different.",
      "- DO NOT assume 'William' and 'Liam' are equivalent here (treat as non-match).",
      "",
      "Confidence rubric:",
      "- 10: identical after normalization",
      "- 8-9: very likely same person (minor punctuation/hyphen/casing/transliteration/typos)",
      "- 5-7: plausible but not certain",
      "- 0-4: likely different person",
    ].join("\n"),
    input: [
      `Target name: ${target}`,
      `Candidate name: ${candidate}`,
      "",
      "Decide match=true/false.",
    ].join("\n"),
    maxOutputTokens: 300,
  })

  const confidence =
    typeof result.confidence === "number"
      ? Math.max(0, Math.min(10, result.confidence))
      : 0

  return {
    match: !!result.match,
    confidence,
    reason: (result.reason ?? "").trim() || "No reason provided.",
  }
}


