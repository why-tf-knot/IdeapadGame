#!/bin/bash

# BuildPaper Quick Start Script
# This script helps you get the BuildPaper backend running quickly

set -e

echo "🚀 BuildPaper Quick Start"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version is $NODE_VERSION, but 18+ is recommended${NC}"
fi

echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) installed${NC}"

# Check if MongoDB is accessible
echo ""
echo "🔍 Checking MongoDB connection..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}📝 Please review and update .env if needed${NC}"
fi

# Load MongoDB URI from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/buildpaper"}

# Try to connect to MongoDB (basic check)
echo "Testing MongoDB at: $MONGODB_URI"
if command -v mongosh &> /dev/null; then
    if mongosh "$MONGODB_URI" --eval "db.version()" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Could not connect to MongoDB${NC}"
        echo "Make sure MongoDB is running at: $MONGODB_URI"
        echo "You can install MongoDB locally or use MongoDB Atlas (cloud)"
    fi
else
    echo -e "${YELLOW}⚠️  mongosh not found - skipping MongoDB connection test${NC}"
    echo "The server will attempt to connect when it starts"
fi

# Check if node_modules exists
echo ""
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a minute)..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Ask user if they want to load demo data
echo ""
echo "💡 Do you want to load demo data? (y/n)"
echo "   This will create sample users and ideas for testing"
read -r LOAD_DEMO

if [[ "$LOAD_DEMO" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📊 Loading demo data..."
    npx ts-node demo-data.ts
    echo ""
    echo -e "${GREEN}✅ Demo data loaded successfully!${NC}"
    echo ""
    echo "🔑 Demo Login Credentials:"
    echo "   Investor: john@example.com / demo123"
    echo "   Founder:  sarah@example.com / demo123"
    echo ""
fi

# Start the server
echo ""
echo "🎯 Starting BuildPaper server..."
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
