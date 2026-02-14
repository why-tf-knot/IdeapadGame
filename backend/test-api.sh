#!/bin/bash

# BuildPaper API Testing Script
# Tests all major API endpoints with sample data

API_URL="${API_URL:-http://localhost:3000}"
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}🚀 BuildPaper API Test Suite${NC}\n"
echo -e "Testing API at: ${BLUE}$API_URL${NC}\n"

# Test 1: Health Check
echo -e "${BOLD}1. Health Check${NC}"
curl -s "$API_URL/health" | jq '.' 2>/dev/null || echo "Server not responding"
echo ""

# Test 2: Register a new investor
echo -e "\n${BOLD}2. Register Investor${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Investor",
    "email": "test-investor@example.com",
    "password": "test123",
    "role": "INVESTOR"
  }')
echo "$REGISTER_RESPONSE" | jq '.'

# Test 3: Login as existing investor
echo -e "\n${BOLD}3. Login as Investor${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "demo123"
  }')
echo "$LOGIN_RESPONSE" | jq '.'
INVESTOR_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

# Test 4: Get current user info
echo -e "\n${BOLD}4. Get Current User (Investor)${NC}"
curl -s "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $INVESTOR_TOKEN" | jq '.'

# Test 5: Get investor wallet
echo -e "\n${BOLD}5. Get Investor Wallet${NC}"
curl -s "$API_URL/api/credits/wallet/me" \
  -H "Authorization: Bearer $INVESTOR_TOKEN" | jq '.'

# Test 6: Get next idea to review
echo -e "\n${BOLD}6. Get Next Idea to Review${NC}"
IDEA_RESPONSE=$(curl -s "$API_URL/api/review/next" \
  -H "Authorization: Bearer $INVESTOR_TOKEN")
echo "$IDEA_RESPONSE" | jq '.'
IDEA_ID=$(echo "$IDEA_RESPONSE" | jq -r '.idea._id')

# Test 7: Login as founder
echo -e "\n${BOLD}7. Login as Founder${NC}"
FOUNDER_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "demo123"
  }')
echo "$FOUNDER_LOGIN" | jq '.'
FOUNDER_TOKEN=$(echo "$FOUNDER_LOGIN" | jq -r '.token')

# Test 8: Get founder's ideas
echo -e "\n${BOLD}8. Get Founder's Ideas${NC}"
curl -s "$API_URL/api/ideas/my" \
  -H "Authorization: Bearer $FOUNDER_TOKEN" | jq '.'

# Test 9: Create a new idea
echo -e "\n${BOLD}9. Create New Idea${NC}"
NEW_IDEA=$(curl -s -X POST "$API_URL/api/ideas" \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Idea",
    "oneLineSummary": "This idea was created via API test",
    "category": "SaaS",
    "stage": "Idea",
    "targetUser": "API testers",
    "problem": "Need to test API endpoints",
    "solution": "Create ideas programmatically",
    "differentiation": "Automated testing",
    "monetization": "Free for testing",
    "roadmap": "Keep testing"
  }')
echo "$NEW_IDEA" | jq '.'

# Test 10: Get equity breakdown for an idea
if [ "$IDEA_ID" != "null" ] && [ -n "$IDEA_ID" ]; then
  echo -e "\n${BOLD}10. Get Equity Breakdown${NC}"
  curl -s "$API_URL/api/equity/idea/$IDEA_ID" \
    -H "Authorization: Bearer $INVESTOR_TOKEN" | jq '.'
else
  echo -e "\n${YELLOW}Skipping equity test - no idea ID available${NC}"
fi

# Test 11: Save an idea (if we have one)
if [ "$IDEA_ID" != "null" ] && [ -n "$IDEA_ID" ]; then
  echo -e "\n${BOLD}11. Save an Idea${NC}"
  curl -s -X POST "$API_URL/api/review/$IDEA_ID/save" \
    -H "Authorization: Bearer $INVESTOR_TOKEN" | jq '.'
fi

# Test 12: Batch enrich ideas
echo -e "\n${BOLD}12. Batch Enrich Ideas${NC}"
curl -s -X POST "$API_URL/api/batch/batch-enrich" \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ideaIds": ["'$IDEA_ID'"]
  }' | jq '.'

echo -e "\n${GREEN}✅ API tests complete!${NC}\n"
