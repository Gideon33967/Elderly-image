import { GoogleGenerativeAI } from "@google/generative-ai";
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a YouTube B-Roll video strategist for a health/medical channel targeting elderly audiences.

Analyze this script and break it into scenes. For each scene provide:
1. A scene number
2. A short description of what's happening
3. A 2-3 word Pixabay search keyword for relevant stock footage
4. A rough timestamp (e.g. "0:00-0:15")

Return ONLY a valid JSON array with no markdown, no backticks, no explanation. Example format:
[
  {
    "sceneNumber": 1,
    "description": "Introduction showing the aging heart and blood vessels",
    "keyword": "elderly heart health",
    "timestamp": "0:00-0:15"
  },
  {
    "sceneNumber": 2,
    "description": "Senior walking in a park for daily exercise",
    "keyword": "senior walking park",
    "timestamp": "0:15-0:35"
  }
]

Script to analyze:
${script}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Safely extract JSON array from response
    const startIdx = text.indexOf("[");
    const endIdx = text.lastIndexOf("]");

    if (startIdx === -1 || endIdx === -1) {
      console.error("Gemini raw response:", text);
      return NextResponse.json(
        { error: `Gemini returned unexpected format. Raw: ${text.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const jsonStr = text.substring(startIdx, endIdx + 1);
    const scenes = JSON.parse(jsonStr);

    return NextResponse.json({ scenes });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error from Gemini API." },
      { status: 500 }
    );
  }
}
