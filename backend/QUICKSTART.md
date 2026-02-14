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

## Verify Installation

```bash
# Check if server is running
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T15:34:59.789Z"
}
```

## Load Demo Data (Optional)

To populate the database with sample data:

```bash
npm run demo
```

This creates:
- Demo users (founders and investors)
- Sample ideas
- Credit allocations
- Initial transactions

## Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your MongoDB URI if different from default:
   ```
   MONGODB_URI=mongodb://localhost:27017/buildpaper
   ```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check your Atlas connection
- Verify the `MONGODB_URI` in `.env` file

### Port Already in Use
- Change the `PORT` in `.env` file
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`

### Dependencies Issues
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

## What's Next?

See [README.md](README.md) for:
- Complete API documentation
- Architecture overview
- Development guidelines
- Deployment instructions
