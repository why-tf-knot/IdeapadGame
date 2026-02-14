#!/bin/bash
echo "🎬 BuildPaper API Preview Demo"
echo "================================"
echo ""

echo "1️⃣ Login as Investor (john@example.com)"
echo "----------------------------------------"
LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"demo123"}')
echo "$LOGIN" | jq '.'
TOKEN=$(echo "$LOGIN" | jq -r '.token')
echo ""

echo "2️⃣ Get Investor Wallet"
echo "----------------------------------------"
curl -s http://localhost:3000/api/credits/wallet/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "3️⃣ Get Next Idea to Review (Paper Toss!)"
echo "----------------------------------------"
IDEA=$(curl -s http://localhost:3000/api/review/next \
  -H "Authorization: Bearer $TOKEN")
echo "$IDEA" | jq '.'
IDEA_ID=$(echo "$IDEA" | jq -r '.idea._id')
echo ""

echo "4️⃣ Save the Idea (Swipe Right!)"
echo "----------------------------------------"
curl -s -X POST http://localhost:3000/api/review/$IDEA_ID/save \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "5️⃣ Invest 100 Credits in the Idea"
echo "----------------------------------------"
curl -s -X POST http://localhost:3000/api/credits/invest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ideaId\":\"$IDEA_ID\",\"amount\":100}" | jq '.'
echo ""

echo "6️⃣ Check Updated Wallet (after investment)"
echo "----------------------------------------"
curl -s http://localhost:3000/api/credits/wallet/me \
  -H "Authorization: Bearer $TOKEN" | jq '.wallet'
echo ""

echo "7️⃣ Login as Founder (sarah@example.com)"
echo "----------------------------------------"
FOUNDER_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@example.com","password":"demo123"}')
echo "$FOUNDER_LOGIN" | jq '.'
FOUNDER_TOKEN=$(echo "$FOUNDER_LOGIN" | jq -r '.token')
echo ""

echo "8️⃣ Get My Ideas"
echo "----------------------------------------"
curl -s http://localhost:3000/api/ideas/my \
  -H "Authorization: Bearer $FOUNDER_TOKEN" | jq '.ideas[] | {title, stage, aiBalance}'
echo ""

echo "9️⃣ Use AI Tool (Improve Summary - 10 credits)"
echo "----------------------------------------"
curl -s -X POST http://localhost:3000/api/credits/spend \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ideaId\":\"$IDEA_ID\",\"service\":\"LLM_SUMMARY_IMPROVE\",\"amount\":10}" | jq '.'
echo ""

echo "🔟 Get Equity Breakdown for Idea"
echo "----------------------------------------"
curl -s http://localhost:3000/api/equity/idea/$IDEA_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "✅ Preview Demo Complete!"
echo "=========================="
echo ""
echo "📱 What you just saw:"
echo "  • Investor logged in with 1000 credits"
echo "  • Reviewed an idea (Paper Toss interface)"
echo "  • Saved the idea (Swipe right gesture)"
echo "  • Invested 100 credits in the idea"
echo "  • Founder accessed their ideas"
echo "  • Used AI tool to improve pitch"
echo "  • Checked equity ownership"
echo ""
echo "🎯 This demonstrates the core BuildPaper flow!"
echo "📖 See PREVIEW_GUIDE.md for full documentation"
