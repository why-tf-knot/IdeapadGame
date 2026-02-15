/**
 * Simple Preview Server for BuildPaper
 * Runs without MongoDB to demonstrate the API structure
 */

import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock data
const mockInvestor = {
  _id: '1',
  name: 'John Smith',
  email: 'john@example.com',
  role: 'INVESTOR'
};

const mockFounder = {
  _id: '2',
  name: 'Sarah Chen',
  email: 'sarah@example.com',
  role: 'FOUNDER'
};

const mockIdeas = [
  {
    _id: 'idea1',
    founderId: '2',
    title: 'TechFlow AI',
    oneLineSummary: 'AI-powered workflow automation that saves developers 10+ hours per week',
    category: 'AI Tool',
    stage: 'MVP',
    targetUser: 'Software developers',
    problem: 'Developers waste hours on repetitive tasks',
    solution: 'Automate workflows with AI',
    differentiation: 'Focus on workflows not just code',
    monetization: '$29/mo per developer',
    roadmap: 'Q1: Launch MVP, Q2: Custom workflows',
    status: 'ACTIVE'
  },
  {
    _id: 'idea2',
    founderId: '2',
    title: 'EduMatch',
    oneLineSummary: 'Connect students with perfect tutors using AI matching',
    category: 'App',
    stage: 'Prototype',
    targetUser: 'Students',
    problem: 'Finding right tutor is hard',
    solution: 'AI-powered matching',
    differentiation: 'Behavioral psychology + AI',
    monetization: '15% commission',
    roadmap: 'Q1: Beta launch',
    status: 'ACTIVE'
  }
];

let walletBalance = 1000;
let savedIdeas: string[] = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'BuildPaper API Preview Server',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (password !== 'demo123') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = email.includes('john') || email.includes('emily') ? mockInvestor : mockFounder;
  
  res.json({
    token: 'mock-jwt-token-' + user._id,
    user
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body;
  res.json({
    token: 'mock-jwt-token-new',
    user: { _id: 'new', name, email, role }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token?.includes('1') ? mockInvestor : mockFounder;
  res.json({ user });
});

// Review endpoints
app.get('/api/review/next', (req, res) => {
  const unseenIdea = mockIdeas.find(i => !savedIdeas.includes(i._id));
  if (unseenIdea) {
    res.json({ idea: unseenIdea });
  } else {
    res.json({ idea: null, message: 'No more ideas to review' });
  }
});

app.post('/api/review/:ideaId/save', (req, res) => {
  const { ideaId } = req.params;
  if (!savedIdeas.includes(ideaId)) {
    savedIdeas.push(ideaId);
  }
  res.json({ success: true, message: 'Idea saved' });
});

app.post('/api/review/:ideaId/reject', (req, res) => {
  res.json({ success: true, message: 'Idea rejected' });
});

// Credits endpoints
app.get('/api/credits/wallet/me', (req, res) => {
  res.json({
    wallet: {
      totalBalance: walletBalance,
      userId: '1'
    },
    transactions: [
      {
        _id: 't1',
        type: 'GRANT_TO_INVESTOR',
        amount: 1000,
        memo: 'Monthly grant',
        createdAt: new Date()
      }
    ]
  });
});

app.post('/api/credits/invest', (req, res) => {
  const { amount, ideaId } = req.body;
  
  if (amount > walletBalance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  walletBalance -= amount;
  
  res.json({
    success: true,
    allocation: {
      ideaId,
      investorId: '1',
      amount
    },
    newBalance: walletBalance
  });
});

app.post('/api/credits/spend', (req, res) => {
  const { ideaId, service, amount } = req.body;
  
  // Simulate AI response
  let result = '';
  switch (service) {
    case 'LLM_SUMMARY_IMPROVE':
      result = 'Revolutionize developer workflows with AI-powered automation that eliminates 10+ hours of repetitive tasks weekly';
      break;
    case 'LLM_PITCH_DRAFT':
      result = `Slide 1: The Problem\n- Developers lose 10+ hours weekly on repetitive tasks\n- Manual workflows are error-prone\n\nSlide 2: Our Solution\n- TechFlow AI automates common workflows\n- Powered by GPT-4 and custom ML models\n\nSlide 3: Market Opportunity\n- 27M developers worldwide\n- $500B developer tools market\n\nSlide 4: Business Model\n- $29/mo per developer\n- $199/mo for teams\n\nSlide 5: Traction\n- MVP with 5 workflows\n- Early users save 12 hours/week\n\nSlide 6: The Ask\n- Seeking AI credits for growth\n- Scale to 10+ workflows`;
      break;
    case 'LLM_ROADMAP_GENERATE':
      result = `6-Month Roadmap:\n\nMonth 1-2: MVP Enhancement\n- Add 3 more workflows\n- Improve accuracy to 95%\n- Launch beta program\n\nMonth 3-4: Growth\n- Custom workflow builder\n- Team collaboration features\n- Integrate with GitHub\n\nMonth 5-6: Scale\n- Enterprise features\n- API for partners\n- 50+ workflows`;
      break;
    default:
      result = 'AI-generated response placeholder';
  }
  
  res.json({
    success: true,
    result,
    cached: false,
    creditsSpent: amount
  });
});

// Ideas endpoints
app.get('/api/ideas/my', (req, res) => {
  res.json({
    ideas: mockIdeas.map(idea => ({
      ...idea,
      aiBalance: 250
    }))
  });
});

app.post('/api/ideas', (req, res) => {
  const newIdea = {
    _id: 'idea-' + Date.now(),
    founderId: '2',
    ...req.body,
    status: 'ACTIVE',
    createdAt: new Date()
  };
  res.status(201).json({ idea: newIdea });
});

app.get('/api/ideas/:id', (req, res) => {
  const idea = mockIdeas.find(i => i._id === req.params.id) || mockIdeas[0];
  res.json({ idea });
});

// Equity endpoint
app.get('/api/equity/idea/:ideaId', (req, res) => {
  res.json({
    ideaId: req.params.ideaId,
    totalAllocated: 250,
    totalConsumed: 30,
    estimatedEquityPool: 0.3,
    investors: [
      {
        investorId: '1',
        name: 'John Smith',
        allocated: 200,
        percentOfTotal: 80,
        estimatedEquity: 0.24
      },
      {
        investorId: '3',
        name: 'Emily Watson',
        allocated: 50,
        percentOfTotal: 20,
        estimatedEquity: 0.06
      }
    ]
  });
});

// Batch endpoint
app.post('/api/batch/batch-enrich', (req, res) => {
  const { ideaIds } = req.body;
  
  const enrichedIdeas = ideaIds.map((id: string) => ({
    ideaId: id,
    aiBalance: 250,
    allocations: [
      { investorId: '1', amount: 200 }
    ],
    equity: {
      totalAllocated: 200,
      estimatedEquity: 0.2
    }
  }));
  
  res.json({ ideas: enrichedIdeas });
});

// Serve interactive preview page
app.get('/', (req, res) => {
  try {
    const html = readFileSync('./preview.html', 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error loading preview.html:', error);
    res.status(500).send('Error loading preview page');
  }
});

// Serve mobile preview page
app.get('/mobile', (req, res) => {
  try {
    const html = readFileSync('./mobile-preview.html', 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error loading mobile-preview.html:', error);
    res.status(500).send('Error loading mobile preview page');
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🎬 ================================');
  console.log('   BuildPaper Preview Server');
  console.log('   ================================\n');
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('\n📋 Available Endpoints:');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/register');
  console.log('   GET  /api/auth/me');
  console.log('   GET  /api/review/next');
  console.log('   POST /api/review/:id/save');
  console.log('   POST /api/review/:id/reject');
  console.log('   GET  /api/credits/wallet/me');
  console.log('   POST /api/credits/invest');
  console.log('   POST /api/credits/spend');
  console.log('   GET  /api/ideas/my');
  console.log('   POST /api/ideas');
  console.log('   GET  /api/equity/idea/:id');
  console.log('   POST /api/batch/batch-enrich');
  console.log('\n🔑 Test Credentials:');
  console.log('   Investor: john@example.com / demo123');
  console.log('   Founder: sarah@example.com / demo123');
  console.log('\n🧪 Test the API:');
  console.log('   ./test-api.sh');
  console.log('\n📖 Full guide: See PREVIEW_GUIDE.md');
  console.log('\n✅ Server ready! Start exploring...\n');
});
