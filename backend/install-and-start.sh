#!/bin/bash

# BuildPaper Backend - Installation and Startup Script
# This script automates the setup process for the backend server

set -e  # Exit on any error

echo ""
echo "🚀 BuildPaper Backend - Automated Setup"
echo "========================================"
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Step 1: Install dependencies
echo "📦 Step 1/4: Installing dependencies..."
if npm install; then
  echo "✅ Dependencies installed successfully"
else
  echo "❌ Failed to install dependencies"
  exit 1
fi
echo ""

# Step 2: Check if .env exists
echo "⚙️  Step 2/4: Checking environment configuration..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please configure MongoDB URI in .env file:"
    echo "   MONGODB_URI=mongodb://localhost:27017/buildpaper"
  else
    echo "⚠️  .env.example not found, creating basic .env file..."
    cat > .env << 'EOF'
PORT=3000
MONGODB_URI=mongodb://localhost:27017/buildpaper
JWT_SECRET=change-this-secret-in-production
MONTHLY_GRANT_AMOUNT_INVESTOR=1000
CREDITS_PER_EQUITY_PERCENT=10000
EOF
    echo "✅ Created basic .env file"
    echo "⚠️  Please update MONGODB_URI and JWT_SECRET in .env"
  fi
else
  echo "✅ .env file already exists"
fi
echo ""

# Step 3: Run pre-flight checks
echo "🔍 Step 3/4: Running pre-flight checks..."
if node check-setup.js; then
  echo "✅ Pre-flight checks passed"
else
  echo "⚠️  Pre-flight checks completed with warnings (continuing anyway)"
fi
echo ""

# Step 4: Start the server
echo "🌐 Step 4/4: Starting the server..."
echo ""
echo "Server will start on: http://localhost:3000"
echo "Health check endpoint: http://localhost:3000/health"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""
echo "Optional: Load demo data by running 'npm run demo' in another terminal"
echo ""

# Start the development server
npm run dev
