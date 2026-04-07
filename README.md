# B-Roll Engine 🎬

AI-powered B-Roll footage finder. Paste a YouTube script → Gemini breaks it into scenes → Pixabay finds matching footage → Download everything as a ZIP.

---

## Setup (5 Steps)

### 1. Upload to GitHub
- Create a new GitHub repo (e.g. `broll-engine`)
- Upload ALL these files maintaining the folder structure

### 2. Connect to Vercel
- Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
- Framework: **Next.js** (auto-detected)

### 3. Add Environment Variables in Vercel
Go to: Project → Settings → Environment Variables. Add these two:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your key from [aistudio.google.com](https://aistudio.google.com) |
| `PIXABAY_API_KEY` | Your key from [pixabay.com/api](https://pixabay.com/api/docs/) |

**Important:** Key names must be EXACTLY as shown above (case-sensitive).

### 4. Deploy
- Click **Deploy**
- When it finishes, uncheck "Use existing build cache" and redeploy if you made any changes

### 5. Get Your API Keys

**Gemini:**
1. Go to https://aistudio.google.com
2. Click "Get API Key" → Create API Key
3. If you see "User location not supported" — add a billing card to your Google account (stays free)

**Pixabay:**
1. Go to https://pixabay.com/api/docs/
2. Log in / sign up (free)
3. Your API key is shown at the top of that page

---

## File Structure
```
src/
  app/
    page.tsx                          ← Main UI
    layout.tsx                        ← HTML layout
    globals.css                       ← Styles
    api/
      analyze-script/route.ts         ← Gemini AI endpoint
      get-videos/route.ts             ← Pixabay search endpoint
      download-zip/route.ts           ← ZIP download endpoint
package.json
vercel.json
tsconfig.json
next.config.js
```

---

## Troubleshooting

| Error on screen | Fix |
|---|---|
| `GEMINI_API_KEY is not set` | Check spelling in Vercel env vars |
| `User location not supported` | Add billing card to Google account |
| `API key not valid` | Re-copy key from AI Studio |
| `Pixabay API error: 400` | Check PIXABAY_API_KEY in Vercel |
| No videos found | Keyword too specific — Gemini will auto-adjust |
