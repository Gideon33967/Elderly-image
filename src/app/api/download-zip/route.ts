import { NextResponse } from "next/server";
// @ts-ignore
import JSZip from "jszip";

export async function POST(req: Request) {
  try {
    const { urls } = await req.json();

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided." }, { status: 400 });
    }

    const zip = new JSZip();

    // Download each video and add to zip
    await Promise.all(
      urls.map(async ({ url, filename }: { url: string; filename: string }) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch ${url}`);
          const buffer = await response.arrayBuffer();
          zip.file(filename, buffer);
        } catch (err) {
          console.error(`Skipping ${filename}:`, err);
        }
      })
    );

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new Response(new Blob([zipBuffer]), {
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
