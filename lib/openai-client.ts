import "server-only"

import OpenAI from "openai"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const OPENAI_MODEL = "gpt-5-mini"

export const openai = new OpenAI({
  apiKey: requireEnv("OPENAI_API_KEY"),
})


