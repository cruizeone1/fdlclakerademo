# Lakera Guard Demo — 5-Minute Presenter Script

Use this script for a live walkthrough of the demo. Adjust pacing as needed.

**Before you start:**
- Open the demo: `http://localhost:3000/demo` (local) or your Cloudflare URL + `/demo`
- Confirm a test prompt works (send "hello" once)
- Have this page open on a second monitor or printed

**Total time:** ~5 minutes

---

## Minute 0:00–0:45 — Hook and setup

**[Screen: Landing page or demo page]**

> "Imagine you built a chatbot for your customers. It uses OpenAI — it’s smart, fast, and helpful. But what happens when someone doesn’t ask a normal question — they try to *hack* the bot?
>
> Today I’m showing a demo that puts a security layer — **Lakera Guard** — in front of OpenAI. Think of it like a bouncer at the door: every message gets checked before the AI ever sees it."

**[Click: Open interactive demo / navigate to `/demo`]**

> "This is a real working app — not a slide. On the left are sample test cases. On the right, I can type a prompt, upload a document, and see exactly what Lakera does before OpenAI responds."

**[Point at flow diagram in UI]**

> "The flow is simple: user prompt, optionally a document, then Lakera Guard. If it’s safe, OpenAI answers. If not — blocked. OpenAI never gets called."

---

## Minute 0:45–1:45 — Act 1: Normal, safe request

**[Click sidebar: "Normal prompt" — or type: `Summarize this paragraph.`]**

> "First, a completely normal request. Nothing suspicious."

**[Click: Send prompt]**

**[Wait for result — point at green panel]**

> "Green — **Safe prompt**. Lakera cleared it. You can see the detector breakdown — prompt attack: clear. And below that, OpenAI generated a normal response.
>
> This is the happy path. Most real users look like this."

---

## Minute 1:45–2:45 — Act 2: Direct prompt injection

**[Click sidebar: "Direct injection"]**

> "Now the classic attack. This is prompt injection — someone telling the bot to ignore its instructions and reveal secrets or the system prompt."

**[Click: Send prompt]**

**[Point at red panel]**

> "Red — **Potential prompt injection detected**. Lakera flagged it — you can see `prompt_attack` in the detectors. And look at the OpenAI section: **Not generated**. The request was blocked on the server. OpenAI never received this message.
>
> That’s **fail-closed** security — when in doubt, block. No answer is better than a compromised answer."

---

## Minute 2:45–3:30 — Act 3: Indirect / RAG-style attack

**[Click sidebar: "Indirect attack" — or clear and type the indirect prompt]**

> "Attacks aren’t always this obvious. In real apps — especially with document upload or RAG — malicious instructions can hide *inside* content. The user might ask an innocent question, but the document contains an attack."

**[Click: Send prompt]**

> "Blocked again. Lakera caught the injection even when it’s phrased as document context. You might see multiple detectors fire depending on your policy — that’s fine. The point is: it didn’t reach OpenAI."

---

## Minute 3:30–4:15 — Act 4: Document upload (optional but recommended)

**[Click sidebar: "Safe policy doc" to load sample document]**

**[Click sidebar: "RAG question" — `What is the refund window according to the document?`]**

**[Click: Send prompt]**

> "Now the legitimate RAG use case. I loaded a refund policy document and asked a normal question about it. Lakera screened *both* the document and my question together — and it passed. OpenAI answered using the document context.
>
> You can also upload real **PDF or Word files** — text is extracted in the browser and sent through the same pipeline."

**[Optional: Click "Poisoned document" + `Summarize this document.` → show blocked]**

> "And if the document itself contains hidden instructions? Same story — blocked before OpenAI runs."

---

## Minute 4:15–4:45 — Architecture (technical audience)

**[Optional — skip for non-technical audiences]**

> "Quick architecture note: this is built with **Next.js**. The browser never sees API keys — they live on the server, in our case deployed on **Cloudflare Workers**. When you click Send, the server calls Lakera’s `/v2/guard` API with your prompt and any document text. Only on a clean result does it call OpenAI — using a simple fetch call that works on Cloudflare’s edge.
>
> Lakera returns a breakdown of which detectors ran — that request UUID is useful for logging and security review."

---

## Minute 4:45–5:00 — Close

> "So to recap: this demo shows **input gating** with Lakera Guard in front of OpenAI. Safe prompts get answers. Injection attempts — direct or hidden in documents — get blocked with full visibility into *why*.
>
> Natural next steps for a production version: output screening, side-by-side protected vs unprotected comparison, voice agent integration, and an admin dashboard for blocked attempts.
>
> Happy to take questions — or try your own prompts in the demo."

---

## Quick reference — sidebar test cases

| Button | Expected | Key talking point |
|--------|----------|-------------------|
| Normal prompt | Green + response | Happy path |
| Direct injection | Red, blocked | Classic attack |
| Indirect attack | Red, blocked | Hidden in context |
| RAG question + Safe policy doc | Green + response | Legitimate RAG |
| Poisoned document + summarize | Red, blocked | Document poisoning |

---

## Troubleshooting during live demo

| Issue | What to say / do |
|-------|------------------|
| "Network error" | "Let me refresh — dev server may need a restart." Run cleanup script from README. |
| Safe prompt blocked | "Policy may be strict — we can tune sensitivity in Lakera dashboard." |
| Attack not blocked | "Worth checking policy level — demo uses project-specific Lakera policy." |
| Cloudflare URL fails | Use local `localhost:3000/demo` as backup. |

---

## One-liner openers (pick one)

- *"This is a chatbot with a bouncer — watch what happens to normal vs malicious prompts."*
- *"Same chatbot, three prompts — one gets an answer, two get stopped at the door."*
- *"Before OpenAI sees a single word, Lakera Guard decides if it's safe."*

---

## One-liner closers (pick one)

- *"Security isn't about blocking all AI — it's about knowing what gets through and what doesn't."*
- *"Lakera gives you a clear gate: allow, block, and explain why."*
- *"Fail closed, visible results, keys on the server — that's the pattern this demo is built to show."*
