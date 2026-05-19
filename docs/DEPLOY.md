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

1. Push this repo to **GitHub** or **GitLab** (do not commit `.env.local` or `.dev.vars`).
2. Open [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**.
3. Connect your repository.
4. Configure the build:

| Setting | Value |
|---------|-------|
| Framework preset | None (or Workers) |
| Build command | `npm run deploy` |
| Root directory | `/` |

If the dashboard asks for a separate build/deploy flow, use:

- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy:** connect Workers CI/CD per [Cloudflare docs](https://developers.cloudflare.com/workers/ci-cd/)

5. Add **environment variables / secrets** in the project settings:

| Name | Type | Required |
|------|------|----------|
| `OPENAI_API_KEY` | Secret | Yes |
| `LAKERA_API_KEY` | Secret | Yes |
| `LAKERA_PROJECT_ID` | Secret / Text | Yes |
| `OPENAI_MODEL` | Text | No (`gpt-4o-mini`) |
| `NEXT_PUBLIC_SITE_URL` | Text | No (set after first deploy) |

6. Deploy and open your Workers URL.

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
| 500 on `/api/chat` | Verify secrets in Cloudflare dashboard; redeploy after adding them |
| `nodejs_compat` errors | Ensure `wrangler.jsonc` has `nodejs_compat` flag |
| Lakera auth error | Check `LAKERA_API_KEY` and `LAKERA_PROJECT_ID` secrets |
| OpenAI error | Check key, billing, and `OPENAI_MODEL` |
| Build fails locally on Windows | Try `npm run deploy` from WSL or use Cloudflare Git CI/CD |
| Metadata shows localhost | Set `NEXT_PUBLIC_SITE_URL` to production URL |

---

## Project files for Cloudflare

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Worker name, runtime flags, assets binding |
| `open-next.config.ts` | OpenNext Cloudflare adapter config |
| `next.config.ts` | Next.js + `initOpenNextCloudflareForDev()` |
| `public/_headers` | Cache static assets at the edge |
| `.dev.vars` | Local secrets for `npm run preview` (not committed) |
