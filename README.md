# CP Field Assistant 🛡️
### AI-powered Cathodic Protection field guidance — Powered by Peabody's

An intelligent field assistant that identifies any CP equipment from a photo and provides step-by-step guidance for freshers. Backed by **Peabody's Control of Pipeline Corrosion (2nd Edition)**.

---

## Deploy to Vercel in 5 Minutes

### Step 1 — Get your Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Upload to GitHub
1. Create a new repo at [github.com/new](https://github.com/new)
2. Name it `cp-field-assistant`
3. Upload all these files (drag & drop works)

### Step 3 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Click **Environment Variables** → Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-xxxx...` (your key from Step 1)
4. Click **Deploy** ✅

### Step 4 — Share the link!
Vercel gives you a URL like `https://cp-field-assistant.vercel.app`
Share it with your whole team. Works on mobile too!

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local and paste your ANTHROPIC_API_KEY

# 3. Run locally
npm run dev

# Open http://localhost:3000
```

---

## Project Structure

```
cp-field-assistant/
├── pages/
│   ├── _app.js          # App wrapper
│   ├── index.js         # Main UI
│   └── api/
│       └── analyze.js   # Server-side API (keeps key safe!)
├── styles/
│   └── globals.css      # Global styles
├── .env.example         # Template for env vars
├── next.config.js       # Next.js config
├── package.json         # Dependencies
└── README.md            # This file
```

## Security Note
Your `ANTHROPIC_API_KEY` lives only on the server (Vercel environment variables).
It is **never** exposed to the browser or end users. ✅

---

## How It Works
1. User uploads a photo of CP equipment
2. Browser sends image to `/api/analyze` (your server)
3. Server calls Claude with the image + Peabody expert system prompt
4. AI returns identification + step-by-step field instructions
5. Results displayed in clean, fresher-friendly format

---

Built with Next.js · Anthropic Claude · Peabody's Control of Pipeline Corrosion
