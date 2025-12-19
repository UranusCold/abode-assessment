import "server-only"

import { createStructuredOutput } from "@/lib/structured-output"

export type TargetNameGenerationResult = {
  targetName: string
}

const targetNameSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    targetName: { type: "string" },
  },
  required: ["targetName"],
} as const

export async function generateTargetName(prompt: string) {
  const trimmed = prompt.trim()
  if (!trimmed) {
    throw new Error("Prompt is required.")
  }

  const result = await createStructuredOutput<TargetNameGenerationResult>({
    name: "TargetName",
    description: "A single generated target name string.",
    schema: targetNameSchema,
    instructions: [
      "You are a target name generator.",
      "Given a user prompt, generate EXACTLY ONE target name string.",
      "Return ONLY valid JSON that matches the provided schema.",
      "Do not include extra keys.",
      "The targetName value must be a single string (not an array).",
    ].join("\n"),
    input: trimmed,
    maxOutputTokens: 256,
  })

  const targetName = result.targetName?.trim()
  if (!targetName) {
    throw new Error("Model returned an empty targetName.")
  }

  return { targetName }
}


