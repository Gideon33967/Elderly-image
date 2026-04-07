import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const { script } = await req.json();
    
    // 1. Initialize with the official SDK
    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. Use the 'gemini-pro' or 'gemini-1.5-flash-latest' alias
    // This resolves the 404 error by pointing to the current stable endpoint
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `Analyze this YouTube script for a senior health channel. 
    Break it into scenes and return ONLY a JSON array. 
    Script: ${script}`;

    // 3. Use the standardized generateContent method
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up potential markdown formatting from the AI
    const jsonString = text.replace(/```json|```/g, "").trim();
    const scenes = JSON.parse(jsonString);

    return NextResponse.json({ scenes });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
