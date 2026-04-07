"use client";
import React, { useState } from "react";

interface Scene {
  sceneNumber: number;
  description: string;
  keyword: string;
  timestamp: string;
}

interface VideoHit {
  id: number;
  videos: { medium: { url: string } };
  tags: string;
}

interface SceneVideo {
  scene: Scene;
  video: VideoHit | null;
}

type AppStatus = "idle" | "analyzing" | "searching" | "done" | "error";

export default function Home() {
  const [script, setScript] = useState("");
  const [sceneVideos, setSceneVideos] = useState<SceneVideo[]>([]);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [downloading, setDownloading] = useState(false);

  const processScript = async () => {
    if (!script.trim()) return alert("Please paste a script first!");

    setStatus("analyzing");
    setSceneVideos([]);
    setErrorMsg("");

    try {
      // Step 1: Analyze script with Gemini
      const aiRes = await fetch("/api/analyze-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok || aiData.error) {
        setErrorMsg(aiData.error || "AI analysis failed.");
        setStatus("error");
        return;
      }

      const scenes: Scene[] = aiData.scenes;
      setStatus("searching");

      // Step 2: Search Pixabay for each scene
      const results: SceneVideo[] = [];
      for (const scene of scenes) {
        const videoRes = await fetch("/api/get-videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: scene.keyword }),
        });
        const videoData = await videoRes.json();
        results.push({
          scene,
          video: videoData.hits?.[0] || null,
        });
      }

      setSceneVideos(results);
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Unexpected error. Check Vercel logs.");
      setStatus("error");
    }
  };

  const downloadZip = async () => {
    setDownloading(true);
    try {
      const urls = sceneVideos
        .filter((sv) => sv.video)
        .map((sv) => ({
          url: sv.video!.videos.medium.url,
          filename: `Scene_${sv.scene.sceneNumber}_${sv.scene.keyword.replace(/\s+/g, "_")}.mp4`,
        }));

      const res = await fetch("/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) throw new Error("Zip creation failed");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "broll_footage.zip";
      link.click();
    } catch (err: any) {
      alert("Download failed: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const statusMessages: Record<AppStatus, string> = {
    idle: "",
    analyzing: "🤖 Gemini is reading your script and breaking it into scenes...",
    searching: "🔎 Searching Pixabay for matching footage...",
    done: `✅ Found footage for ${sceneVideos.filter((s) => s.video).length} of ${sceneVideos.length} scenes.`,
    error: `❌ Error: ${errorMsg}`,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        color: "#e8e8e8",
        padding: "40px 20px",
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 860, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "inline-block",
              background: "#ff4d00",
              color: "#0a0a0f",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
              padding: "4px 10px",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            B-Roll Engine v1.0
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 52px)",
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: -1,
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
            }}
          >
            Script → Stock Footage,
            <br />
            <span style={{ color: "#ff4d00" }}>Instantly.</span>
          </h1>
          <p
            style={{
              color: "#666",
              marginTop: 12,
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            Paste your YouTube script. AI breaks it into scenes. Pixabay finds the footage.
          </p>
        </div>

        {/* Input area */}
        <div
          style={{
            border: "1px solid #222",
            background: "#0f0f18",
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              borderBottom: "1px solid #1a1a2a",
              padding: "8px 16px",
              fontSize: 11,
              color: "#444",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            your_script.txt
          </div>
          <textarea
            style={{
              width: "100%",
              minHeight: 220,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#c8c8d0",
              padding: "20px",
              fontSize: 14,
              lineHeight: 1.8,
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            placeholder={`Paste your script here...\n\nExample:\n"After 60, your heart pumps differently. The arteries become stiffer, and blood pressure tends to rise. Walking even 20 minutes a day can counteract this dramatically..."`}
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
        </div>

        {/* Action button */}
        <button
          onClick={processScript}
          disabled={status === "analyzing" || status === "searching"}
          style={{
            width: "100%",
            padding: "18px",
            background: status === "analyzing" || status === "searching" ? "#1a1a2a" : "#ff4d00",
            color: status === "analyzing" || status === "searching" ? "#444" : "#0a0a0f",
            border: "none",
            borderRadius: 4,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            cursor: status === "analyzing" || status === "searching" ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          {status === "analyzing"
            ? "▶ Analyzing Script..."
            : status === "searching"
            ? "▶ Fetching Footage..."
            : "▶ Generate B-Roll"}
        </button>

        {/* Status bar */}
        {status !== "idle" && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: status === "error" ? "#1a0a0a" : "#0f1a0f",
              border: `1px solid ${status === "error" ? "#3a1a1a" : "#1a3a1a"}`,
              borderRadius: 4,
              fontSize: 13,
              color: status === "error" ? "#ff6666" : "#66cc66",
            }}
          >
            {statusMessages[status]}
          </div>
        )}

        {/* Results */}
        {sceneVideos.length > 0 && (
          <div style={{ marginTop: 48 }}>
            {/* Download button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#444", textTransform: "uppercase" }}>
                — Scene Breakdown
              </div>
              <button
                onClick={downloadZip}
                disabled={downloading}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: downloading ? "#444" : "#ff4d00",
                  border: `1px solid ${downloading ? "#333" : "#ff4d00"}`,
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  cursor: downloading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {downloading ? "Zipping..." : "↓ Download All (.zip)"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {sceneVideos.map(({ scene, video }, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 0,
                    border: "1px solid #1a1a2a",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  {/* Scene info */}
                  <div
                    style={{
                      padding: 24,
                      background: "#0f0f18",
                      borderRight: "1px solid #1a1a2a",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#ff4d00",
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Scene {scene.sceneNumber} · {scene.timestamp}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: "#aaa", margin: 0 }}>
                      {scene.description}
                    </p>
                    <div
                      style={{
                        marginTop: 12,
                        display: "inline-block",
                        background: "#1a1a2a",
                        padding: "4px 10px",
                        borderRadius: 2,
                        fontSize: 11,
                        color: "#555",
                        letterSpacing: 1,
                      }}
                    >
                      keyword: {scene.keyword}
                    </div>
                  </div>

                  {/* Video */}
                  <div style={{ background: "#050508" }}>
                    {video ? (
                      <video
                        controls
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      >
                        <source src={video.videos.medium.url} type="video/mp4" />
                      </video>
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          minHeight: 160,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#333",
                          fontSize: 13,
                        }}
                      >
                        No footage found
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 60, borderTop: "1px solid #111", paddingTop: 20, fontSize: 11, color: "#333", letterSpacing: 1 }}>
          B-ROLL ENGINE · POWERED BY GEMINI + PIXABAY
        </div>
      </div>
    </main>
  );
}
