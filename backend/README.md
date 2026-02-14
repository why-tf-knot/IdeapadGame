# BuildPaper Backend

BuildPaper is an AI-powered idea validation and equity-based funding platform that connects founders with investors through a unique credit system.

## 🚀 Quick Start

For the fastest setup, see [QUICKSTART.md](QUICKSTART.md)

**TL;DR:**
```bash
cd backend
npm install
npm run dev
```

Server will be running at: **http://localhost:3000**

## 📋 Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **MongoDB** - Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** or **yarn** - Package manager

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/why-tf-knot/IdeapadGame.git
cd IdeapadGame/backend
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment configuration
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **socket.io** - Real-time communication
- **TypeScript** and type definitions

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to configure your settings:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/buildpaper
JWT_SECRET=your-secret-key-change-this-in-production
MONTHLY_GRANT_AMOUNT_INVESTOR=1000
CREDITS_PER_EQUITY_PERCENT=10000
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

### 4. Pre-flight Check (Optional)

Run the pre-flight check to verify your setup:

```bash
node check-setup.js
```

This checks:
- ✓ Node.js version (18+)
- ✓ All dependencies installed
- ✓ Environment file exists
- ✓ MongoDB connectivity
- ✓ Port availability
- ✓ TypeScript configuration

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

Starts the server with auto-reload on file changes using `nodemon` and `ts-node`.

### Production Mode

```bash
npm run build
npm start
```

First compiles TypeScript to JavaScript, then runs the compiled code.

### Automated Setup & Start

Use the one-command setup script:

```bash
./install-and-start.sh
```

This script:
1. Installs all dependencies
2. Creates `.env` from `.env.example` if needed
3. Runs pre-flight checks
4. Optionally loads demo data
5. Starts the development server

## 📊 Demo Data

Load sample data for testing:

```bash
npm run demo
```

This creates:
- **4 demo users** (2 founders, 2 investors)
- **4 sample ideas** across different stages
- **Credit wallets** for all users
- **Credit allocations** between investors and ideas
- **Transaction history**
- **Investor-idea relationships**

**Demo Credentials:**
```
Founder 1: sarah@example.com / demo123
Founder 2: alex@example.com / demo123
Investor 1: michael@example.com / demo123
Investor 2: jennifer@example.com / demo123
```

## 🏗️ Architecture

### Project Structure

```
backend/
├── src/
│   ├── models/           # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Idea.ts
│   │   ├── AiCreditWallet.ts
│   │   └── ...
│   ├── routes/           # Express routes
│   │   ├── auth.ts
│   │   ├── ideas.ts
│   │   ├── credits.ts
│   │   └── ...
│   ├── middleware/       # Custom middleware
│   │   └── auth.ts
│   ├── services/         # Business logic
│   └── server.ts         # Application entry point
├── demo-data.ts          # Demo data script
├── check-setup.js        # Pre-flight verification
├── install-and-start.sh  # Automated setup script
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
└── .env.example          # Environment template
```

### Technology Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.io
- **Security:** bcryptjs for password hashing

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp

### Authentication
```
POST /api/auth/register   - Register new user
POST /api/auth/login      - Login user
GET  /api/auth/me         - Get current user
```

### Ideas
```
GET    /api/ideas           - List all ideas
POST   /api/ideas           - Create new idea
GET    /api/ideas/:id       - Get idea details
PUT    /api/ideas/:id       - Update idea
DELETE /api/ideas/:id       - Delete idea
POST   /api/ideas/:id/stage - Update idea stage
```

### Credits & Equity
```
GET  /api/credits/wallet         - Get user's credit wallet
POST /api/credits/allocate       - Allocate credits to idea
GET  /api/credits/allocations    - Get user's allocations
POST /api/equity/claim           - Claim equity for idea
GET  /api/equity/my-equity       - Get user's equity holdings
```

### Reviews & Chat
```
POST /api/review/submit       - Submit idea review
GET  /api/review/history/:id  - Get review history
POST /api/chat/send           - Send chat message
GET  /api/chat/:ideaId        - Get chat history
```

### Batch Operations
```
POST /api/batch/transactions  - Process bulk transactions
POST /api/batch/allocations   - Process bulk allocations
```

## 🔒 Authentication

The API uses JWT for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Obtain a token by:
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`

Protected routes require a valid JWT token.

## 🧪 Testing

### Manual API Testing

Use the included test scripts:

```bash
# Test main API endpoints
./test-api.sh

# Test preview functionality
./test-preview.sh
```

Or use curl:

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"FOUNDER"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solutions:**
- Ensure MongoDB is running: `mongod` or `brew services start mongodb-community`
- Check MongoDB Atlas connection string if using cloud
- Verify `MONGODB_URI` in `.env` file

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill

# Or change the port in .env
PORT=3001
```

### Dependency Installation Fails

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### TypeScript Compilation Errors

**Solutions:**
```bash
# Check TypeScript version
npx tsc --version

# Clean build
rm -rf dist
npm run build
```

## 📚 Development

### Adding New Features

1. **Models:** Add Mongoose schemas in `src/models/`
2. **Routes:** Create route handlers in `src/routes/`
3. **Middleware:** Add custom middleware in `src/middleware/`
4. **Services:** Implement business logic in `src/services/`

### Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature
```

## 🚀 Deployment

### Environment Variables

Set these in your production environment:

```env
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/buildpaper
JWT_SECRET=<generate-secure-random-string>
NODE_ENV=production
```

### Build for Production

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Start Production Server

```bash
npm start
```

Or use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/server.js --name buildpaper-backend
pm2 save
```

## 📖 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Introduction](https://jwt.io/introduction)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## 💬 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Happy Building! 🏗️**
