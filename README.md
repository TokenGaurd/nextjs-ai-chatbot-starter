# Next.js AI Chatbot Starter

A streaming chat app in Next.js 16 + AI SDK v7 — wired through
[TokenGuard](https://tokenguard.dev) so you cannot get a surprise AI bill.

Point it at your own OpenAI or Anthropic key, set a monthly cap, and every
request is metered and hard-stopped at the edge before it reaches the provider.

```bash
git clone <this-repo> && cd nextjs-ai-chatbot-starter
npm install
cp .env.example .env.local   # add your TokenGuard key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Why route through a gateway at all

A leaked or looping API key is a five-figure invoice. The usual answer is a
provider spend limit, which is monthly, coarse, and tells you after the fact.

TokenGuard sits in front of the provider and enforces the cap *on the request
path*:

- **Per-key monthly budgets** — each proxy key gets its own limit. Over it, the
  request is refused before any tokens are spent.
- **An account-wide ceiling** on top of the per-key budgets.
- **A circuit breaker** that trips on a runaway spend rate.
- **Real per-model, per-key usage** in a dashboard, priced from the actual token
  counts rather than estimated.

The free tier covers 2 proxy keys and $50/month of tracked spend.

## Setup

### 1. Create a TokenGuard account

Sign up at [tokenguard.dev](https://tokenguard.dev), then:

1. **Add a provider credential** — your own OpenAI or Anthropic API key. It is
   encrypted at rest and only ever decrypted at the edge to sign the upstream
   call.
2. **Create a proxy key** (`tg_live_…`) and give it a monthly budget. This is
   the key your app uses. Your real provider key never leaves TokenGuard.

### 2. Configure this app

```bash
cp .env.example .env.local
```

| Variable | What it is |
| --- | --- |
| `TOKEN_GUARD_API_KEY` | Your `tg_live_…` proxy key |
| `TOKEN_GUARD_BASE_URL` | TokenGuard's edge proxy endpoint |
| `TOKEN_GUARD_MODEL` | Default model — must match your credential's provider |

### 3. Pick a model your credential can serve

TokenGuard forwards to whichever provider the credential belongs to. It does
**not** translate between providers, so the model id has to be one that provider
serves:

| Your credential | Valid model ids |
| --- | --- |
| Anthropic | `claude-haiku-4-5`, `claude-sonnet-4-5` |
| OpenAI | `gpt-4o-mini`, `gpt-4o` |

Requesting a `claude-*` model on an OpenAI credential fails upstream. To offer
both in one app, add both credentials in TokenGuard and give each its own proxy
key.

## How it fits together

```
 Browser ──▶ /api/chat ──▶ TokenGuard edge proxy ──▶ OpenAI / Anthropic
                                    │
                                    ├── check budget, refuse if over
                                    └── meter tokens, stream back untouched
```

`app/api/chat/route.ts` is an ordinary AI SDK route. The only TokenGuard-aware
part is the `baseURL` — everything else is the standard `streamText` setup, so
you can drop the gateway later by changing one line.

The app uses the OpenAI provider against every upstream, because TokenGuard
speaks the OpenAI wire format regardless of what it forwards to. Note the route
calls `gateway.chat(model)` rather than `gateway(model)`: the bare form targets
OpenAI's newer `/responses` API, which other upstreams do not serve.

## Built with

[Next.js 16](https://nextjs.org) · [AI SDK v7](https://sdk.vercel.ai) ·
[Tailwind CSS v4](https://tailwindcss.com) · [TokenGuard](https://tokenguard.dev)
