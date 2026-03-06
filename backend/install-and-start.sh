#!/bin/bash

# BuildPaper Backend - One-Command Setup and Start Script
# This script automates the setup and startup process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  BuildPaper Backend - Setup & Start${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Error: package.json not found${NC}"
    echo -e "${YELLOW}  Please run this script from the backend directory${NC}"
    exit 1
fi

# Install dependencies
echo -e "${CYAN}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check if .env exists, if not create from .env.example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${CYAN}🔐 Creating .env file from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please configure your MongoDB URI in .env if needed${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Warning: .env.example not found${NC}"
        echo -e "${YELLOW}   You may need to create a .env file manually${NC}"
        echo ""
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
    echo ""
fi

# Run pre-flight checks (optional, continue even if it fails)
echo -e "${CYAN}🔍 Running pre-flight checks...${NC}"
if command -v node &> /dev/null; then
    node check-setup.js || {
        echo -e "${YELLOW}⚠️  Some checks failed, but attempting to start anyway...${NC}"
        echo ""
    }
else
    echo -e "${YELLOW}⚠️  Node.js not found in PATH${NC}"
fi

# Ask user if they want to load demo data
echo ""
read -p "$(echo -e ${CYAN}Would you like to load demo data? [y/N]: ${NC})" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}📊 Loading demo data...${NC}"
    npm run demo || {
        echo -e "${YELLOW}⚠️  Failed to load demo data, continuing...${NC}"
    }
    echo ""
fi

# Start the server
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Starting BuildPaper Backend Server${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}Server will be available at: ${GREEN}http://localhost:3000${NC}"
echo -e "${CYAN}Health check endpoint: ${GREEN}http://localhost:3000/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the development server
npm run dev
