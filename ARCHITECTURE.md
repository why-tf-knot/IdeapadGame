# BuildPaper Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         iOS Mobile App                          │
│                   (React Native + TypeScript)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │   INVESTOR      │  │    FOUNDER     │  │   SHARED        │ │
│  │   SCREENS       │  │    SCREENS     │  │   COMPONENTS    │ │
│  ├─────────────────┤  ├────────────────┤  ├─────────────────┤ │
│  │ • PaperToss     │  │ • MyIdeas      │  │ • Login         │ │
│  │ • SavedIdeas    │  │ • CreateIdea   │  │ • Register      │ │
│  │ • Wallet        │  │ • IdeaDetail   │  │ • Navigation    │ │
│  │ • IdeaEquity    │  │ • AI Tools     │  │ • API Client    │ │
│  └─────────────────┘  └────────────────┘  └─────────────────┘ │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      Backend API Server                         │
│                   (Node.js + Express + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   API Routes Layer                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ /api/auth      │ Register, Login, JWT Validation         │  │
│  │ /api/ideas     │ CRUD for Ideas                          │  │
│  │ /api/review    │ Get Next, Save, Reject                  │  │
│  │ /api/credits   │ Wallet, Invest, Spend                   │  │
│  │ /api/equity    │ Calculate Ownership %                   │  │
│  │ /api/chat      │ Threads, Messages                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Services Layer                          │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ aiService.ts   │ Prompt Templates + AI Integration       │  │
│  │                │ • LLM_SUMMARY_IMPROVE                   │  │
│  │                │ • LLM_PITCH_DRAFT                       │  │
│  │                │ • LLM_ROADMAP_GENERATE                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Middleware Layer                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ authMiddleware │ JWT Validation, User Context            │  │
│  │ roleMiddleware │ FOUNDER / INVESTOR Authorization        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Data Models (Mongoose)                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ User                  │ Idea                              │  │
│  │ InvestorIdeaStatus    │ ChatThread                        │  │
│  │ AiCreditWallet        │ IdeaAiBalance                     │  │
│  │ AiCreditAllocation    │ AiCreditTransaction               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Mongoose ODM
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      MongoDB Database                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Collections:                                                   │
│  • users              (FOUNDER / INVESTOR accounts)             │
│  • ideas              (Pitch submissions)                       │
│  • investorideastatus (Review tracking: SAVED/REJECTED)         │
│  • aicreditwallets    (Credit balances per user)                │
│  • ideaaibalances     (Credits allocated per idea)              │
│  • aicreditallocations (Investor → Idea mappings)               │
│  • aicredittransactions (Audit trail)                           │
│  • chatthreads        (Messages between founders/investors)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

```

## Credit Flow Architecture

```
┌──────────────────────┐
│   Monthly Grant      │  1000 credits
│   (Automated Cron)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Investor Wallet     │  totalBalance: 1000
│  (AiCreditWallet)    │
└──────────┬───────────┘
           │
           │ Invest: 100 credits
           ▼
┌──────────────────────┐
│   Idea Balance       │  balance: 100
│  (IdeaAiBalance)     │
└──────────┬───────────┘
           │
           │ Spend: 20 credits
           ▼
┌──────────────────────┐
│   AI Service Call    │  LLM_PITCH_DRAFT
│   (aiService.ts)     │
└──────────────────────┘

Equity Calculation:
  10,000 credits spent = 1.0% equity pool
  Investor share = (their allocation / total allocated) × equity pool
```

## Mobile Gesture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Paper Toss Screen                        │
└─────────────────────────────────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
      Drag Down      Drag Right      Tap Card
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Crumple  │   │  Flying  │   │  Detail  │
    │ Animation│   │  Paper   │   │  Modal   │
    └─────┬────┘   └─────┬────┘   └──────────┘
          │              │
     Haptic: Warning  Haptic: Success
          │              │
          ▼              ▼
    ┌──────────┐   ┌──────────┐
    │  Reject  │   │   Save   │
    │   API    │   │   API    │
    └──────────┘   └─────┬────┘
                         │
                         ▼
                   ┌──────────┐
                   │  Credit  │
                   │  Modal   │
                   └──────────┘
```

## Agent Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent 7: Code Oversight                      │
│                        (Meta-Agent)                             │
│  • Reviews all code from Agents 2-5                             │
│  • Identifies security vulnerabilities                          │
│  • Suggests performance optimizations                           │
│  • Generates quality metrics                                    │
└────────┬────────────────────────────────────────────────────────┘
         │ Reviews & Improves ↓
         │
    ┌────┴────┬────────┬────────┬────────┐
    │         │        │        │        │
    ▼         ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│Agent 4 ││Agent 3 ││Agent 2 ││Agent 5 │
│Investor││Founder ││Paper   ││AI      │
│Wallet  ││Ideas & ││Toss    ││Service │
│& Equity││AI Tools││Gestures││        │
└────────┘└────────┘└────────┘└────────┘
    │         │        │        │
    └────┬────┴────┬───┴────┬───┘
         │         │        │
         ▼         ▼        ▼
┌─────────────────────────────────────────┐
│         Backend + Mobile App            │
│      Production-Ready MVP ✅            │
└─────────────────────────────────────────┘
```

## Technology Stack

```
Frontend:
  • React Native 0.84
  • TypeScript 5.x
  • React Navigation 6.x
  • React Native Gesture Handler
  • React Native Haptic Feedback
  • Axios (HTTP client)
  • AsyncStorage (persistence)

Backend:
  • Node.js 18+
  • Express 4.x
  • TypeScript 5.x
  • Mongoose 8.x (MongoDB ODM)
  • JWT (jsonwebtoken)
  • bcryptjs (password hashing)
  • Socket.io (ready for real-time)

Database:
  • MongoDB 7.x
  • Indexed collections
  • Reference-based relationships

AI (Ready for Integration):
  • OpenAI GPT-4 (scaffolded)
  • Anthropic Claude (compatible)
  • Google Gemini (compatible)
```

## File Structure

```
IdeapadGame/
├── backend/
│   ├── src/
│   │   ├── models/         (8 Mongoose schemas)
│   │   ├── routes/         (6 API route modules)
│   │   ├── services/       (AI service)
│   │   ├── middleware/     (Auth, roles)
│   │   └── server.ts       (Express app)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── ios-app/
│   ├── src/
│   │   ├── screens/        (11 React Native screens)
│   │   ├── services/       (API client)
│   │   └── types/          (TypeScript interfaces)
│   ├── ios/                (Native iOS project)
│   ├── android/            (Native Android project)
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
├── AGENT_7_CODE_REVIEW.md
└── IMPLEMENTATION_SUMMARY.md
```

## Deployment Architecture (Recommended)

```
┌─────────────────┐
│   Apple Users   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   iOS App       │  (TestFlight → App Store)
│  (React Native) │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│   API Gateway   │  (Cloudflare / AWS API Gateway)
│   + CDN         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │  (Heroku / Render / AWS ECS)
│   (Node.js)     │  Auto-scaling, Load balanced
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB Atlas  │  (Managed, Multi-region)
│   (Database)    │  Automatic backups
└─────────────────┘
```

---

*Architecture designed for scalability, security, and maintainability*
