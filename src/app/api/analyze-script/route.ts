import { GoogleGenerativeAI } from "@google/generative-ai"; // Corrected import
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set." },
        { status: 500 }
      );
    }

    const { script } = await req.json();
    if (!script) {
      return NextResponse.json({ error: "No script provided." }, { status: 400 });
    }

    // Corrected initialization
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const prompt = `
    Analyze this script and break it into scenes. For each scene provide:
    1. A scene number
    2. A short description of what's happening
    3. A 2-3 word Pixabay search keyword for relevant stock footage
    4. A rough timestamp (e.g. "0:00-0:15")

    Return ONLY a valid JSON array.
    Script: ${script}`;

    // Corrected method call
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Clean up markdown if Gemini adds it
    const cleanText = text.replace(/```json|```/g, "").trim();

    const startIdx = cleanText.indexOf("[");
    const endIdx = cleanText.lastIndexOf("]");

    if (startIdx === -1 || endIdx === -1) {
       return NextResponse.json({ error: "Invalid JSON format" }, { status: 500 });
    }

    const scenes = JSON.parse(cleanText.substring(startIdx, endIdx + 1));
    return NextResponse.json({ scenes });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown Gemini error." },
      { status: 500 }
    );
  }
}
