# NAI:Eve

Naïve AI · Eve — a first-year engineering student chatbot with full interaction logging.

## What gets logged

All logs are stored in a Vercel Postgres database (two tables):

| Table | What's recorded |
|-------|----------------|
| `chat_logs` | Every user message and Eve's reply, with session ID, active packs, and timestamp |
| `teach_logs` | Every pack toggle (added/removed) and custom entry, with session ID and timestamp |

Each browser tab gets a unique `session_id` (`sess_<timestamp>_<random>`), so you can trace individual student interactions end-to-end.

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create naieve --public --push
```

### 2. Create a Vercel Postgres store

1. Go to your [Vercel dashboard](https://vercel.com/dashboard) → Storage → Create → Postgres
2. Name it (e.g. `naieve-db`) and click Create
3. In the store settings, click **Connect to Project** and select your repo
4. Vercel automatically adds all `POSTGRES_*` environment variables to your project

### 3. Import and configure in Vercel

1. Go to [vercel.com/new](https://vercel.com/new), import your GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Add these environment variables:
   - `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
   - `ADMIN_TOKEN` = a long random secret (run `openssl rand -hex 32` to generate one)
4. Click **Deploy**

### 4. Initialize the database tables

After your first deploy, run this once to create the tables:

```bash
curl -X GET https://your-app.vercel.app/api/init-db \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

You should get: `{"ok":true,"message":"Tables created (or already exist)."}`

---

## Querying the logs

All log endpoints require the `x-admin-token` header.

### All chat messages (newest first)
```
GET /api/logs?view=chat
```

### All teach events (newest first)
```
GET /api/logs?view=teach
```

### Session summary (one row per instance)
```
GET /api/logs?view=sessions
```

### Filter by a specific session
```
GET /api/logs?view=chat&sessionId=sess_abc123_xyz
GET /api/logs?view=teach&sessionId=sess_abc123_xyz
```

### With curl
```bash
curl https://your-app.vercel.app/api/logs?view=sessions \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

---

## Customizing the baseline

Edit `public/baseline.txt`. The file must start with `===`.
Commit and push — Vercel redeploys automatically.

## Local development

```bash
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY, ADMIN_TOKEN, and POSTGRES_* vars
npm install
npm run dev
```

For local Postgres, you can use the Vercel CLI to pull your env vars:
```bash
npx vercel env pull .env.local
```
