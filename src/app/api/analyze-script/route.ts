import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// This forces Vercel to wait up to 60 seconds instead of 10
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Key missing" }, { status: 500 });

    const { script } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the most universal model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Break this YouTube script into a JSON array of scenes: ${script}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up markdown code blocks if the AI adds them
    const cleanText = text.replace(/```json|```/g, "").trim();
    return NextResponse.json({ scenes: JSON.parse(cleanText) });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
