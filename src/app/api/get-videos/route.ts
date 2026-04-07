import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
    if (!PIXABAY_KEY) {
      return NextResponse.json(
        { error: "PIXABAY_API_KEY is not set in environment variables." },
        { status: 500 }
      );
    }

    const { keyword } = await req.json();
    if (!keyword) {
      return NextResponse.json({ error: "No keyword provided." }, { status: 400 });
    }

    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(keyword)}&per_page=3&safesearch=true`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pixabay error:", errorText);
      return NextResponse.json(
        { error: `Pixabay API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ hits: data.hits || [] });
  } catch (error: any) {
    console.error("Get-videos Error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error fetching videos." },
      { status: 500 }
    );
  }
}
