import { NextResponse } from "next/server"

import { runNameTests } from "@/lib/run-name-tests"

export async function POST() {
  try {
    const result = await runNameTests()
    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to run tests."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


