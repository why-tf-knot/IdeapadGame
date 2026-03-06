# Quick Start - BuildPaper Backend

## Prerequisites
- Node.js 18+ installed
- MongoDB running (local or Atlas)

## Start in 3 Commands

```bash
cd backend
npm install
npm run dev
```

Server will start on: **http://localhost:3000**  
Health check: **http://localhost:3000/health**

## Optional: Load Demo Data

```bash
npm run demo
```

This creates sample users and ideas for testing:
- **Investor 1:** john@example.com / demo123
- **Investor 2:** emily@example.com / demo123  
- **Founder 1:** sarah@example.com / demo123
- **Founder 2:** alex@example.com / demo123

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update MongoDB URI in `.env` if needed:
   ```
   MONGODB_URI=mongodb://localhost:27017/buildpaper
   ```

## Troubleshooting

If the server won't start:
1. Run `node check-setup.js` to verify your environment
2. Ensure MongoDB is running: `mongod --version`
3. Check `.env` file exists with valid MONGODB_URI

## One-Command Setup

For automated setup (Unix/Mac):
```bash
chmod +x install-and-start.sh
./install-and-start.sh
```
