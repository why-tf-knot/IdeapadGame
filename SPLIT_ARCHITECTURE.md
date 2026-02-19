# BuildPaper — Split Architecture

## Overview

BuildPaper is now split into **5 independent packages** — 2 mobile apps and 3 backend services — connected by a shared MongoDB database and a dedicated messaging/transfer service.

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│                                                              │
│  ┌─────────────────┐              ┌─────────────────┐        │
│  │  Founder App    │              │  Investor App   │        │
│  │  (Metro :8081)  │              │  (Metro :8082)  │        │
│  │  - Create Ideas │              │  - Paper Toss   │        │
│  │  - AI Wizard    │              │  - Save/Reject  │        │
│  │  - View Ideas   │              │  - Wallet       │        │
│  │  - Messages     │              │  - Equity       │        │
│  └────┬───────┬────┘              │  - Messages     │        │
│       │       │                   └──┬───────┬──────┘        │
│       │       │                      │       │               │
└───────┼───────┼──────────────────────┼───────┼───────────────┘
        │       │                      │       │
        │       └──────────┬───────────┘       │
        │                  │                   │
        ▼                  ▼                   ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────────┐
│ Founder API  │  │ Shared Services│  │ Investor API     │
│ (port 3001)  │  │ (port 3000)    │  │ (port 3002)      │
│              │  │                │  │                  │
│ • Auth       │  │ • Messaging    │  │ • Auth           │
│ • Ideas CRUD │  │ • Transfers    │  │ • Review/Toss    │
│ • AI Tools   │  │ • Encryption   │  │ • Credits/Wallet │
│ • Credits    │──│ • Audit Log    │──│ • Equity         │
│   (spend)    │  │                │  │ • Batch          │
└──────────────┘  └────────────────┘  └──────────────────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │  (shared)   │
                    └─────────────┘
```

---

## Packages

| Package | Port | Description |
|---------|------|-------------|
| `shared-services/` | 3000 | Secure messaging (AES-256-CBC), credit transfer ledger, encryption |
| `founder-backend/` | 3001 | Founder auth, idea CRUD, AI wizard, credit spending |
| `investor-backend/` | 3002 | Investor auth, paper toss review, wallet, invest, equity, batch |
| `founder-app/` | 8081 | React Native app for founders |
| `investor-app/` | 8082 | React Native app for investors |

---

## Quick Start

```bash
# 1. Install root deps (concurrently)
npm install

# 2. Install all package deps
npm run install:all

# 3. Copy .env.example → .env in each backend
cp shared-services/.env.example shared-services/.env
cp founder-backend/.env.example founder-backend/.env
cp investor-backend/.env.example investor-backend/.env

# 4. Start MongoDB (Docker or local)
# docker run -d -p 27017:27017 mongo:7

# 5. Start all 3 backends
npm run dev

# 6. Start mobile apps (separate terminals)
npm run dev:founder-app
npm run dev:investor-app
```

---

## Service Communication

### Auth (JWT)
All 3 backends share the same `JWT_SECRET`. A token issued by founder-backend is valid on shared-services and vice versa.

### Service-to-Service
Backend services call shared-services via HTTP with the `X-Service-Secret` header:
```
founder-backend  →  POST shared-services/api/transfers/initiate
investor-backend →  POST shared-services/api/transfers/initiate
```

### Secure Messaging
- **Encryption**: AES-256-CBC with per-thread derived keys
- **Key derivation**: `HMAC-SHA256(ENCRYPTION_KEY, ideaId:founderId:investorId)`
- **Integrity**: SHA-256 hash stored alongside each encrypted message
- **Flow**: Clients → shared-services (encrypt at rest, decrypt on read)

### Credit Transfers
- **Two-phase commit**: PENDING → COMPLETED / FAILED
- **Idempotency**: Unique `transferId` prevents duplicate processing
- **Correlation IDs**: Distributed tracing across services
- **Reversal support**: Creates compensating REFUND entries
- **Types**: `INVESTOR_TO_IDEA`, `IDEA_TO_AI_SERVICE`, `MONTHLY_GRANT`, `REFUND`

---

## Founder App Screens

| Screen | Purpose |
|--------|---------|
| Login / Register | Auth (always FOUNDER role) |
| My Ideas | List all founder's ideas |
| Idea Wizard | 4-step AI pitch generation |
| Pitch Generating | Loading animation during AI generation |
| Pitch Summary | Review & finalize generated pitch |
| Idea Detail | View idea details, spend AI credits |
| Messages | List encrypted chat threads |
| Chat | Real-time secure messaging with investors |

## Investor App Screens

| Screen | Purpose |
|--------|---------|
| Login / Register | Auth (always INVESTOR role) |
| Paper Toss | Swipe-to-review idea cards |
| Saved Ideas | Portfolio of saved ideas |
| Wallet | Token balances, monthly grants |
| Idea Equity | Equity breakdown per idea |
| Messages | List encrypted chat threads |
| Chat | Real-time secure messaging with founders |

---

## AI Token System

4 token types representing AI provider credits:

| Token | Provider | Icon | Color |
|-------|----------|------|-------|
| GEMINI | Google | 💎 | #4285F4 |
| ANTHROPIC | Anthropic | 🧠 | #D97706 |
| PERPLEXITY | Perplexity | 🔍 | #22D3EE |
| CHATGPT | OpenAI | 🤖 | #10A37F |

**Flow**: Investor wallet → Idea balance → AI service spend

---

## Environment Variables

Each backend needs a `.env` file. See `*.env.example*` files:

| Variable | Service | Description |
|----------|---------|-------------|
| `PORT` | All | Server port |
| `MONGODB_URI` | All | Shared MongoDB connection |
| `JWT_SECRET` | All | Must be identical across all 3 |
| `SERVICE_SECRET` | shared-services | Service-to-service auth key |
| `ENCRYPTION_KEY` | shared-services | Message encryption master key |
| `SHARED_SERVICES_URL` | founder/investor | URL to shared-services |
| `MONTHLY_GRANT_*` | investor-backend | Monthly grant amounts per token |
