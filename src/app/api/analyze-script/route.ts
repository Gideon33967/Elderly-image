import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set in environment variables." },
        { status: 500 }
      );
    }

    const { script } = await req.json();
    if (!script) {
      return NextResponse.json({ error: "No script provided." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a YouTube B-Roll video strategist for a health/medical channel targeting elderly audiences.

Analyze this script and break it into scenes. For each scene provide:
1. A scene number
2. A short description of what's happening
3. A 2-3 word Pixabay search keyword for relevant stock footage
4. A rough timestamp (e.g. "0:00-0:15")

Return ONLY a valid JSON array with no markdown, no backticks, no explanation. Example:
[
  {
    "sceneNumber": 1,
    "description": "Introduction showing the aging heart and blood vessels",
    "keyword": "elderly heart health",
    "timestamp": "0:00-0:15"
  }
]

Script to analyze:
${script}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text?.trim() ?? "";

    const startIdx = text.indexOf("[");
    const endIdx = text.lastIndexOf("]");

    if (startIdx === -1 || endIdx === -1) {
      return NextResponse.json(
        { error: `Unexpected AI response format: ${text.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const scenes = JSON.parse(text.substring(startIdx, endIdx + 1));
    return NextResponse.json({ scenes });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown Gemini error." },
      { status: 500 }
    );
  }
}
