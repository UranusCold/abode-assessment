import { NextResponse } from "next/server"

import { verifyCandidateName } from "@/lib/name-verifier"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const targetName = typeof body?.targetName === "string" ? body.targetName : ""
  const candidateName =
    typeof body?.candidateName === "string" ? body.candidateName : ""

  if (!targetName.trim()) {
    return NextResponse.json(
      { error: "No target name has been generated yet." },
      { status: 400 }
    )
  }
  if (!candidateName.trim()) {
    return NextResponse.json(
      { error: "Candidate name is required." },
      { status: 400 }
    )
  }

  try {
    const result = await verifyCandidateName({ targetName, candidateName })
    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to verify candidate name."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


