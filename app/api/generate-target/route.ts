import { NextResponse } from "next/server"

import { generateTargetName } from "@/lib/target-name-generator"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const prompt = typeof body?.prompt === "string" ? body.prompt : ""

  if (!prompt.trim()) {
    return NextResponse.json(
      { error: "Prompt is required." },
      { status: 400 }
    )
  }

  try {
    const result = await generateTargetName(prompt)
    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate target name."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


