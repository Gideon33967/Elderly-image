import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const { script } = await req.json();
    
    // Explicitly using the stable v1 API version if possible
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the most compatible stable model name
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const prompt = `Analyze this YouTube script. Break it into scenes and return ONLY a JSON array. Script: ${script}`;

    // Standard call
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Remove markdown backticks if present
    const cleanText = text.replace(/```json|```/g, "").trim();
    const scenes = JSON.parse(cleanText);

    return NextResponse.json({ scenes });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // If 1.5-flash fails, it might be a regional or versioning issue
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
