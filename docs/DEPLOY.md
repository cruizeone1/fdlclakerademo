# Deploying to Cloudflare

This demo runs on **Cloudflare Workers** using the official [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter. Your API keys stay on the server — they are set as Cloudflare secrets, never in the browser.

## Pages after deploy

| URL | Purpose |
|-----|---------|
| `/` | Public landing page |
| `/demo` | Interactive Lakera Guard + OpenAI chat |
| `/api/chat` | Server route (Lakera → OpenAI) |

## Option A: Deploy from your machine (CLI)

### 1. Install dependencies

```bash
npm install
```

### 2. Log in to Cloudflare

```bash
npx wrangler login
```

### 3. Set secrets (required)

Run each command and paste the value when prompted:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put LAKERA_API_KEY
npx wrangler secret put LAKERA_PROJECT_ID
```

Optional — set a public var for link previews (replace with your Workers URL after first deploy):

```bash
npx wrangler secret put OPENAI_MODEL
# or add OPENAI_MODEL to wrangler.jsonc "vars" if not secret
```

For `NEXT_PUBLIC_SITE_URL`, add to `wrangler.jsonc`:

```jsonc
"vars": {
  "NEXT_PUBLIC_SITE_URL": "https://lakera-guard-demo.<your-subdomain>.workers.dev"
}
```

### 4. Preview locally in the Workers runtime (optional)

Copy env vars for local Cloudflare preview:

```bash
cp .dev.vars.example .dev.vars
# Add your keys to .dev.vars (same names as .env.local)
```

Then:

```bash
npm run preview
```

### 5. Deploy

```bash
npm run deploy
```

Cloudflare prints your live URL, e.g. `https://lakera-guard-demo.<account>.workers.dev`.

Update `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` to match, then redeploy.

---

## Option B: Deploy via Cloudflare dashboard (Git)

> **If you see:** *"Wrangler configuration file was found but it does not appear to be valid... pages_build_output_dir"* — you created a **Pages** project. This app must deploy as a **Worker**. Delete the Pages project and follow these steps.

### Correct Cloudflare UI setup (Workers Builds)

1. Push this repo to **GitHub** (do not commit `.env.local` or `.dev.vars`).
2. [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
3. Choose **Worker** → **Connect to Git** (not "Pages" / not static site)
4. Select your repository
5. **Build settings** (Settings → Build):

| Setting | Value |
|---------|-------|
| Production branch | `main` |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |
| Root directory | `/` |

**Do not use** `npm run build` + `npx wrangler deploy` — that runs plain Next.js build and skips OpenNext, causing:

`ERROR Could not find compiled Open Next config, did you run the build command?`

**Alternative (single step):** leave Build command empty and set Deploy command to `npm run deploy` only.

6. **Runtime secrets** (Settings → **Variables and Secrets**):

| Name | Type | Required |
|------|------|----------|
| `OPENAI_API_KEY` | Secret | Yes |
| `LAKERA_API_KEY` | Secret | Yes |
| `LAKERA_PROJECT_ID` | Secret | Yes |
| `OPENAI_MODEL` | Text | No |
| `NEXT_PUBLIC_SITE_URL` | Text | No (set after first deploy) |

7. Deploy / retry the build. Your URL: `https://lakera-guard-demo.<subdomain>.workers.dev`

### Why the Pages error happens

| | **Pages (wrong)** | **Workers (correct)** |
|--|-------------------|----------------------|
| Expects | `pages_build_output_dir` | `main: ".open-next/worker.js"` in `wrangler.jsonc` |
| This app | Config skipped with warning | Works with `/api/chat` |

---

## Custom domain

1. **Workers & Pages** → your project → **Settings** → **Domains & Routes**
2. Add a custom domain (e.g. `demo.yourcompany.com`)
3. Set `NEXT_PUBLIC_SITE_URL` to that domain and redeploy

---

## Local development

| Command | Use |
|---------|-----|
| `npm run dev` | Fast local dev (Node.js) — use `.env.local` |
| `npm run preview` | Test in Cloudflare Workers runtime — use `.dev.vars` |
| `npm run deploy` | Build + deploy to Cloudflare |

---

## Production checklist

- [ ] Secrets set in Cloudflare (not in git)
- [ ] `.env.local` and `.dev.vars` are gitignored
- [ ] `NEXT_PUBLIC_SITE_URL` matches your live URL
- [ ] Lakera project policy tuned for demo traffic
- [ ] OpenAI billing/limits configured
- [ ] Consider rate limiting before a wide public launch

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **No URL after `npm run deploy`** | Build failed before deploy — see **Windows deploy failed** below |
| **EISDIR / readlink on `route.ts`** | Windows + non-C: drive — use GitHub Actions or move to `C:\projects\lakerademo` |
| **EPERM on `.next\trace`** | Stop dev server, delete `.next`, retry |
| 500 on `/api/chat` | Verify Worker secrets; redeploy after adding them |
| `nodejs_compat` errors | Ensure `wrangler.jsonc` has `nodejs_compat` flag |
| Lakera auth error | Check `LAKERA_API_KEY` and `LAKERA_PROJECT_ID` secrets |
| OpenAI error | Check key, billing, and `OPENAI_MODEL` |
| Build fails locally on Windows | **Use GitHub Actions** (below) or WSL |
| **Service binding Worker not found [10143]** | Set `name` and `services[].service` in `wrangler.jsonc` to match your Worker name in Cloudflare dashboard |
| Metadata shows localhost | Set `NEXT_PUBLIC_SITE_URL` to production URL |

---

## Windows deploy failed? Use GitHub Actions (recommended)

`npm run deploy` often **fails on Windows** (especially on `G:\` drives) with:

```
EISDIR: illegal operation on a directory, readlink '...\app\api\chat\route.ts'
```

When that happens, **no URL is printed** because the deploy step never runs.

This repo includes `.github/workflows/deploy-cloudflare.yml` which builds on **Linux**.

### One-time setup

**1. Cloudflare API token** — Dashboard → **My Profile** → **API Tokens** → **Edit Cloudflare Workers** template

**2. Account ID** — **Workers & Pages** → right sidebar

**3. GitHub secrets** — Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Your API token |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID |

**4. Worker secrets** (works on Windows even when build fails):

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put LAKERA_API_KEY
npx wrangler secret put LAKERA_PROJECT_ID
```

**5. Push to GitHub** — Actions runs automatically on push to `main`

**6. Get your URL** after a green workflow run:

`https://lakera-guard-demo.<your-subdomain>.workers.dev`

Or: `npx wrangler deployments list`

---

## Project files for Cloudflare

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Worker name, runtime flags, assets binding |
| `open-next.config.ts` | OpenNext Cloudflare adapter config |
| `next.config.ts` | Next.js + `initOpenNextCloudflareForDev()` |
| `public/_headers` | Cache static assets at the edge |
| `.dev.vars` | Local secrets for `npm run preview` (not committed) |
