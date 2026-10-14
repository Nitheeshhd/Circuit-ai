# Circuito AI

Autonomous embedded systems architect, circuit synthesizer, Indian market BOM pricing calculator, pinout visualizer, and firmware engineering engine for Arduino, ESP32, ESP8266, STM32, and RP2040.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Motion (Framer Motion).
- **Backend / API**: Express 4, Node.js, `@google/genai` (Google Gemini 2.5 Flash / Pro).
- **Auth & Database**: Supabase PostgreSQL with Row Level Security (RLS) & Realtime Sync.
- **Deployment**: Vercel (Vite SPA + Serverless Express Functions via `api/index.ts`).

---

## Quick Start (Local Development)

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- npm (v9.x or v10.x)

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd circuito-ai
npm install
```

### 2. Configure Environment Variables
Copy the template and fill in your keys:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Server-side Gemini AI API Key (never exposed as VITE_*)
GEMINI_API_KEY="your_gemini_api_key"

# Client-side Supabase Credentials
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"

# App URLs
APP_URL="http://localhost:3000"
VITE_APP_URL="http://localhost:3000"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build & Verification

```bash
# Typecheck TypeScript
npm run typecheck

# Build frontend and server
npm run build

# Start production server locally
npm run start
```

---

## Deploying to Vercel

1. **Import the Git Repository** in [Vercel Dashboard](https://vercel.com).
2. **Framework Preset**: Select **Vite** (detected automatically).
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: Add the following in **Vercel Settings → Environment Variables**:
   - `GEMINI_API_KEY` (Required for autonomous circuit generation & diagnostics)
   - `VITE_SUPABASE_URL` (Required for authentication & cloud saves)
   - `VITE_SUPABASE_ANON_KEY` (Required for Supabase client)
   - `APP_URL` (`https://your-project.vercel.app`)
   - `VITE_APP_URL` (`https://your-project.vercel.app`)
6. **Deploy**: Click Deploy. Vercel automatically deploys the SPA frontend and routes `/api/*` to the serverless function in `api/index.ts`.

---

## Project Structure

```text
├── api/
│   └── index.ts                 # Vercel serverless function entrypoint
├── public/
│   └── circuitgen_logo.svg      # App icon and public assets
├── src/
│   ├── components/              # Modular UI components & modals
│   ├── data/                    # Microcontroller boards, prices & presets
│   ├── services/                # Supabase auth/db & payment integration
│   ├── utils/                   # Parser, entitlements, firmware linter, security
│   ├── App.tsx                  # Core application orchestrator
│   ├── index.css                # Design system tokens and styles
│   ├── main.tsx                 # React DOM root entry
│   └── types.ts                 # Unified TypeScript schemas & interfaces
├── .env.example                 # Environment template (NO secrets)
├── .gitignore                   # Git ignore patterns
├── index.html                   # HTML document root
├── package.json                 # Dependencies & scripts
├── server.ts                    # Express backend & AI streaming API
├── supabase-schema.sql          # Supabase SQL database schema & RLS policies
├── tsconfig.json                # TypeScript compiler configuration
├── vercel.json                  # Vercel routing & serverless configuration
└── vite.config.ts               # Vite bundler & Tailwind configuration
```

---

## License

Apache-2.0
