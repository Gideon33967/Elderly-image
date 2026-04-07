import { NextResponse } from "next/server";
// @ts-ignore
import JSZip from "jszip";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided." }, { status: 400 });
    }

    const zip = new JSZip();

    // Download each video and add to zip
    await Promise.all(
      urls.map(async ({ url, filename }: { url: string; filename: string }) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch ${url}`);
          
          // Using arrayBuffer is correct for binary data
          const buffer = await response.arrayBuffer();
          zip.file(filename, buffer);
        } catch (err) {
          console.error(`Skipping ${filename}:`, err);
        }
      })
    );

    // Generate the zip as a Uint8Array
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    // The 'as any' cast fixes the TypeScript build error in Vercel
    return new Response(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="broll_footage.zip"',
      },
    });
  } catch (error: any) {
    console.error("Zip Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create zip." },
      { status: 500 }
    );
  }
}
