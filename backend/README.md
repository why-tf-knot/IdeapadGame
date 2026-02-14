# BuildPaper Backend

RESTful API backend for BuildPaper - the investment platform connecting startup founders with investors using AI credits.

## 📋 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account

### Three Commands to Run
```bash
cd backend
npm install
npm run dev
```

Server runs on: **http://localhost:3000**

For detailed quick start, see [QUICKSTART.md](./QUICKSTART.md)

## 🔧 Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/buildpaper
JWT_SECRET=your-secure-secret-key-change-in-production
MONTHLY_GRANT_AMOUNT_INVESTOR=1000
CREDITS_PER_EQUITY_PERCENT=10000
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Or run directly
mongod --dbpath /path/to/data/db
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### 4. Pre-flight Check (Optional)

Run the setup verification script:
```bash
node check-setup.js
```

This checks:
- Node.js version (18+)
- Dependencies installed
- Environment variables configured
- MongoDB accessibility
- Source files present

## 🚀 Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### One-Command Setup (Unix/Mac)
```bash
chmod +x install-and-start.sh
./install-and-start.sh
```

This script will:
1. Install dependencies
2. Create `.env` if missing
3. Run pre-flight checks
4. Start the server

## 📊 Demo Data

Load sample data for testing:
```bash
npm run demo
```

This creates:
- 4 users (2 founders, 2 investors)
- 4 startup ideas
- AI credit wallets and allocations
- Sample transactions

**Demo Login Credentials:**
- **Investor 1:** john@example.com / demo123
- **Investor 2:** emily@example.com / demo123
- **Founder 1:** sarah@example.com / demo123
- **Founder 2:** alex@example.com / demo123

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status

### Authentication
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
GET  /api/auth/me          # Get current user info
```

### Ideas
```
GET    /api/ideas          # List all ideas
POST   /api/ideas          # Create new idea
GET    /api/ideas/:id      # Get idea details
PUT    /api/ideas/:id      # Update idea
DELETE /api/ideas/:id      # Delete idea
```

### Review (Investors)
```
GET  /api/review/queue     # Get ideas to review
POST /api/review/save      # Save idea for later
POST /api/review/reject    # Reject idea
GET  /api/review/saved     # Get saved ideas
```

### Credits
```
GET  /api/credits/wallet           # Get investor wallet
POST /api/credits/allocate         # Allocate credits to idea
GET  /api/credits/allocations      # Get all allocations
GET  /api/credits/transactions     # Get transaction history
POST /api/credits/grant            # Grant credits to investor (admin)
```

### Equity
```
GET /api/equity/idea/:ideaId       # Get equity distribution for idea
GET /api/equity/investor/:userId   # Get investor's equity positions
```

### Chat (AI Assistant)
```
POST /api/chat/send                # Send message to AI assistant
GET  /api/chat/threads             # Get chat threads
GET  /api/chat/threads/:id         # Get specific thread
```

### Batch Operations
```
POST /api/batch/ideas              # Create multiple ideas
POST /api/batch/allocations        # Create multiple allocations
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── server.ts              # Main server entry point
│   ├── models/                # MongoDB schemas
│   │   ├── User.ts
│   │   ├── Idea.ts
│   │   ├── AiCreditWallet.ts
│   │   ├── AiCreditAllocation.ts
│   │   ├── AiCreditTransaction.ts
│   │   ├── IdeaAiBalance.ts
│   │   ├── InvestorIdeaStatus.ts
│   │   └── ChatThread.ts
│   ├── routes/                # API route handlers
│   │   ├── auth.ts
│   │   ├── ideas.ts
│   │   ├── review.ts
│   │   ├── credits.ts
│   │   ├── equity.ts
│   │   ├── chat.ts
│   │   └── batch.ts
│   ├── middleware/            # Express middleware
│   │   └── auth.ts            # JWT authentication
│   └── services/              # Business logic
│       ├── aiService.ts
│       ├── analyticsService.ts
│       └── cacheService.ts
├── demo-data.ts               # Demo data generator
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript config
├── .env.example               # Environment template
├── check-setup.js             # Pre-flight checker
├── install-and-start.sh       # Automated setup script
├── QUICKSTART.md              # Quick start guide
└── README.md                  # This file
```

## 🧪 Testing

### Manual API Testing

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Using the Test Scripts

Test authentication:
```bash
./test-api.sh
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server (requires build first) |
| `npm run demo` | Load demo data into database |
| `node check-setup.js` | Verify environment setup |

## 🔒 Security Notes

- Change `JWT_SECRET` in `.env` before production deployment
- Never commit `.env` file to version control
- Use environment-specific secrets for different deployments
- Implement rate limiting for production (not included in basic setup)

## 🐛 Troubleshooting

### Server won't start
1. Run `node check-setup.js` to diagnose issues
2. Verify MongoDB is running: `mongod --version`
3. Check `.env` file exists with valid configuration
4. Ensure port 3000 is not in use: `lsof -i :3000`

### MongoDB connection errors
- **Local:** Ensure MongoDB service is running
- **Atlas:** Verify connection string and IP whitelist
- Check network connectivity and firewall settings

### Dependencies issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript compilation errors
```bash
npm run build
```
Check for type errors in the output

## 📚 Technology Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.x
- **Framework:** Express 5.x
- **Database:** MongoDB (via Mongoose 9.x)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Dev Tools:** ts-node, nodemon

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review the QUICKSTART.md guide

---

**Built with ❤️ for the BuildPaper platform**
