import "server-only"

import { openai, OPENAI_MODEL } from "@/lib/openai-client"

export type JSONSchema = Record<string, unknown>

function tryParseJSONObject(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error("Empty model output.")
  }

  const parsed = (() => {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Best-effort fallback: if the model wraps JSON with extra text, extract the first object.
      const match = trimmed.match(/\{[\s\S]*\}/)
      if (!match) throw new Error("No JSON object found in model output.")
      return JSON.parse(match[0])
    }
  })()

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Parsed output is not a JSON object.")
  }

  return parsed
}

type ChatCompletionResponse = Awaited<ReturnType<typeof openai.chat.completions.create>>

function extractRawJSONText(response: ChatCompletionResponse) {
  if (!("choices" in response)) {
    throw new Error("Streaming chat completions are not supported by createStructuredOutput().")
  }

  const choice = response.choices?.[0]
  const message = choice?.message

  const refusal = message?.refusal ?? null
  if (refusal) {
    throw new Error(`Model refusal: ${refusal}`)
  }

  const rawFromContent =
    typeof message?.content === "string" ? message.content : ""

  const rawFromToolCallArgs = (() => {
    const toolCall = message?.tool_calls?.[0]
    if (!toolCall) return ""
    if (toolCall.type !== "function") return ""
    const args = toolCall.function?.arguments
    return typeof args === "string" ? args : ""
  })()

  const raw = rawFromContent || rawFromToolCallArgs
  const finishReason = choice?.finish_reason ?? "unknown"
  const hasToolCalls = !!message?.tool_calls?.length

  return { raw, finishReason, hasToolCalls }
}

export async function createStructuredOutput<T>({
  name,
  description,
  schema,
  instructions,
  input,
  maxOutputTokens = 400,
}: {
  name: string
  description?: string
  schema: JSONSchema
  instructions: string
  input: string
  maxOutputTokens?: number
}): Promise<T> {
  async function request(tokens: number) {
    return await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input },
      ],
      stream: false,
      reasoning_effort: "minimal",
      max_completion_tokens: tokens,
      response_format: {
        type: "json_schema",
        json_schema: {
          name,
          description,
          schema,
          strict: true,
        },
      },
    })
  }

  let response = await request(maxOutputTokens)
  let extracted = extractRawJSONText(response)

  // With strict json_schema, some models return empty content if the output would be truncated.
  if (!extracted.raw && extracted.finishReason === "length") {
    const retryTokens = Math.max(800, maxOutputTokens * 4)
    response = await request(retryTokens)
    extracted = extractRawJSONText(response)
  }

  const { raw, finishReason, hasToolCalls } = extracted

  try {
    return tryParseJSONObject(raw) as T
  } catch (err) {
    throw new Error(
      `Failed to parse structured output JSON for ${name}. finish_reason=${finishReason} has_tool_calls=${hasToolCalls} Raw output: ${raw}`,
      { cause: err }
    )
  }
}


