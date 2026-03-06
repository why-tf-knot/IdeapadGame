# 🚀 START HERE - BuildPaper Quick Setup Guide

Welcome! This guide will get BuildPaper running on your local machine in just a few minutes.

## 📋 Prerequisites Check

Before you begin, make sure you have these installed:

### Required
- ✅ **Node.js 18+** - [Download here](https://nodejs.org)
- ✅ **npm 8+** - Comes with Node.js
- ✅ **MongoDB** - Choose one option:
  - **Local MongoDB** - [Download Community Edition](https://www.mongodb.com/try/download/community)
  - **MongoDB Atlas** - [Free cloud database](https://www.mongodb.com/cloud/atlas/register)

### Quick Check
Run these commands to verify:
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 8.x or higher
mongosh --version # If using local MongoDB
```

## 🎯 Quick Start (3 Steps)

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Run the Startup Script
```bash
./start.sh
```

That's it! The script will:
- ✅ Check all prerequisites
- ✅ Install dependencies automatically
- ✅ Create `.env` file if needed
- ✅ Offer to load demo data
- ✅ Start the server

### Step 3: Verify It's Running

Open your browser and visit:
```
http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

✨ **Success!** Your server is running!

## 📖 Manual Setup (Alternative)

If you prefer to do it manually or the script doesn't work:

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env and update if needed
nano .env  # or use your favorite editor
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string
- Update `MONGODB_URI` in `.env`

### 4. Load Demo Data (Optional but Recommended)
```bash
npx ts-node demo-data.ts
```

This creates:
- 4 demo users (2 investors, 2 founders)
- 4 sample ideas at different stages
- Credit allocations and transactions

### 5. Start the Server
```bash
npm run dev
```

## 🔑 Demo Accounts

After loading demo data, you can test with these accounts:

### Investors
```
Email: john@example.com
Password: demo123
Credits: 1000
```

```
Email: emily@example.com  
Password: demo123
Credits: 850
```

### Founders
```
Email: sarah@example.com
Password: demo123
Ideas: TechFlow AI, EduMatch
```

```
Email: alex@example.com
Password: demo123
Ideas: GreenCommute, CodeSnippet Pro
```

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"demo123"}'
```

Save the token from the response, then:

### Get Wallet Balance
```bash
curl http://localhost:3000/api/credits/wallet/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Run Automated Tests
```bash
cd backend
./test-api.sh
```

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module 'typescript'"
**Solution:** Run `npm install` in the backend directory

### Issue: "MongoDB connection error"
**Solutions:**
1. **Local MongoDB not running?**
   ```bash
   # Start MongoDB
   mongod
   ```

2. **Wrong connection string?**
   - Check `MONGODB_URI` in `.env`
   - Default: `mongodb://localhost:27017/buildpaper`

3. **Using MongoDB Atlas?**
   - Get connection string from Atlas dashboard
   - Update `.env` with your cluster's URI
   - Make sure to whitelist your IP address

### Issue: "Port 3000 already in use"
**Solution:** 
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Issue: "Demo data script fails"
**Solutions:**
1. Make sure MongoDB is running
2. Check the `MONGODB_URI` variable in .env file
3. Try with explicit URI:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/buildpaper npx ts-node demo-data.ts
   ```

### Issue: "Permission denied: ./start.sh"
**Solution:**
```bash
chmod +x start.sh
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts           # Main entry point
│   ├── models/             # MongoDB schemas
│   │   ├── User.ts
│   │   ├── Idea.ts
│   │   └── ...
│   ├── routes/             # API endpoints
│   │   ├── auth.ts
│   │   ├── ideas.ts
│   │   ├── credits.ts
│   │   └── ...
│   ├── middleware/         # Auth & error handling
│   └── services/           # Business logic
├── .env.example            # Environment template
├── .env                    # Your config (create this)
├── package.json            # Dependencies
├── demo-data.ts            # Sample data script
├── start.sh                # Quick start script
└── START_HERE.md          # This file!
```

## 🎯 What's Available

Once the server is running, you have access to:

### API Endpoints
- **Authentication** - `/api/auth/*`
  - Register, login, get profile
- **Ideas** - `/api/ideas/*`
  - Create, update, view ideas (founders)
- **Review** - `/api/review/*`
  - Get next idea, save, reject (investors)
- **Credits** - `/api/credits/*`
  - Check balance, invest, spend
- **Equity** - `/api/equity/*`
  - View equity calculations
- **Chat** - `/api/chat/*`
  - Message threads between investors/founders
- **Batch** - `/api/batch/*`
  - Efficient bulk operations

### Health Check
- **Health** - `/health`
  - Server status check

## 🎮 What to Try

### As an Investor
1. Login with `john@example.com`
2. Get next idea: `GET /api/review/next`
3. Save an idea: `POST /api/review/:ideaId/save`
4. Allocate credits: `POST /api/credits/invest`
5. View saved ideas: `GET /api/review/saved`
6. Check wallet: `GET /api/credits/wallet/me`

### As a Founder
1. Login with `sarah@example.com`
2. View your ideas: `GET /api/ideas/my`
3. Create new idea: `POST /api/ideas`
4. Check idea credits: `GET /api/credits/idea/:ideaId`
5. Use AI tools: `POST /api/credits/spend`
6. View equity split: `GET /api/equity/idea/:ideaId`

## 📊 Tech Stack Summary

- **Backend**: Node.js + TypeScript + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Dev Tools**: nodemon + ts-node
- **Port**: 3000 (configurable)

## 🚀 Next Steps

After you have the backend running:

1. **Explore the API** - Use curl or Postman to test endpoints
2. **Check the iOS app** - See [ios-app/README.md](../ios-app/README.md)
3. **Read documentation**:
   - [README.md](../README.md) - Full project overview
   - [PREVIEW_GUIDE.md](../PREVIEW_GUIDE.md) - Detailed preview guide
   - [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
   - [DEPLOYMENT.md](../DEPLOYMENT.md) - Production deployment

## 💡 Development Tips

### Watch Mode
The default `npm run dev` uses nodemon for auto-reload:
- Edit any `.ts` file
- Server automatically restarts
- Check console for compilation errors

### Production Build
```bash
npm run build  # Compile TypeScript
npm start      # Run compiled JavaScript
```

### Clear Database
To start fresh:
```bash
# Drop the database
mongosh buildpaper --eval "db.dropDatabase()"

# Reload demo data
npx ts-node demo-data.ts
```

### View Logs
Server logs show:
- ✅ Successful requests
- ❌ Errors with stack traces
- 💰 Credit transactions
- 🔐 Authentication attempts

## 🆘 Need Help?

### Documentation
- Full README: [README.md](../README.md)
- Preview Guide: [PREVIEW_GUIDE.md](../PREVIEW_GUIDE.md)
- API Testing: Run `./test-api.sh`

### Common Commands
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm start       # Run production build
npm install     # Install dependencies
npx ts-node     # Run TypeScript files
```

### Still Stuck?
1. Check the troubleshooting section above
2. Review error messages carefully
3. Verify all prerequisites are installed
4. Check MongoDB is accessible
5. Look for port conflicts

## ✅ Success Checklist

- [ ] Node.js 18+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Demo data loaded (optional)
- [ ] Server starts without errors
- [ ] Health check returns `{"status":"ok"}`
- [ ] Can login with demo accounts
- [ ] API endpoints respond correctly

## 🎉 You're Ready!

If you've completed the checklist above, you're all set! 

The BuildPaper backend is now running and ready to power the iOS app.

**Happy Building! 🚀**

---

*For questions or issues, check the main [README.md](../README.md) or review the [PREVIEW_GUIDE.md](../PREVIEW_GUIDE.md)*
