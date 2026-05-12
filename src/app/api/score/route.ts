import { NextRequest, NextResponse } from "next/server";
import { calculateScore } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const { jd, resume } = await req.json();

    if (!jd || !resume) {
      return NextResponse.json(
        { error: "Missing job description or resume" },
        { status: 400 }
      );
    }

    const result = calculateScore(jd, resume);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scoring API Error:", error);
    return NextResponse.json(
      { error: "Failed to calculate score" },
      { status: 500 }
    );
  }
}
