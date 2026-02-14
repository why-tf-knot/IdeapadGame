/**
 * Demo Data Script for BuildPaper
 * Creates sample users, ideas, and allocations to preview the app
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './src/models/User';
import Idea from './src/models/Idea';
import AiCreditWallet from './src/models/AiCreditWallet';
import IdeaAiBalance from './src/models/IdeaAiBalance';
import AiCreditAllocation from './src/models/AiCreditAllocation';
import AiCreditTransaction from './src/models/AiCreditTransaction';
import InvestorIdeaStatus from './src/models/InvestorIdeaStatus';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/buildpaper-demo';

async function createDemoData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Idea.deleteMany({});
    await AiCreditWallet.deleteMany({});
    await IdeaAiBalance.deleteMany({});
    await AiCreditAllocation.deleteMany({});
    await AiCreditTransaction.deleteMany({});
    await InvestorIdeaStatus.deleteMany({});

    // Create demo users
    console.log('👥 Creating demo users...');
    const passwordHash = await bcrypt.hash('demo123', 10);

    const founder1 = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      passwordHash,
      role: 'FOUNDER'
    });

    const founder2 = await User.create({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      passwordHash,
      role: 'FOUNDER'
    });

    const investor1 = await User.create({
      name: 'John Smith',
      email: 'john@example.com',
      passwordHash,
      role: 'INVESTOR'
    });

    const investor2 = await User.create({
      name: 'Emily Watson',
      email: 'emily@example.com',
      passwordHash,
      role: 'INVESTOR'
    });

    console.log('✅ Created 4 users (2 founders, 2 investors)');

    // Create investor wallets with credits
    console.log('💰 Creating investor wallets...');
    await AiCreditWallet.create({
      userId: investor1._id,
      totalBalance: 1000
    });

    await AiCreditWallet.create({
      userId: investor2._id,
      totalBalance: 850
    });

    await AiCreditTransaction.create({
      toUserId: investor1._id,
      type: 'GRANT_TO_INVESTOR',
      amount: 1000,
      memo: 'Monthly grant'
    });

    await AiCreditTransaction.create({
      toUserId: investor2._id,
      type: 'GRANT_TO_INVESTOR',
      amount: 1000,
      memo: 'Monthly grant'
    });

    console.log('✅ Created investor wallets with 1000 credits each');

    // Create demo ideas
    console.log('💡 Creating demo ideas...');
    
    const idea1 = await Idea.create({
      founderId: founder1._id,
      title: 'TechFlow AI',
      oneLineSummary: 'AI-powered workflow automation that saves developers 10+ hours per week',
      category: 'AI Tool',
      stage: 'MVP',
      targetUser: 'Software developers and DevOps engineers',
      problem: 'Developers waste hours on repetitive tasks like code reviews, documentation, and deployment workflows',
      solution: 'TechFlow AI automates common development workflows using GPT-4 and custom ML models',
      differentiation: 'Unlike GitHub Copilot, we focus on workflow automation not just code completion',
      monetization: '$29/mo per developer, $199/mo for teams',
      roadmap: 'Q1: Launch MVP with 5 workflows\nQ2: Add custom workflow builder\nQ3: Enterprise features',
      deckSlides: [],
      status: 'ACTIVE'
    });

    const idea2 = await Idea.create({
      founderId: founder1._id,
      title: 'EduMatch',
      oneLineSummary: 'Connect students with perfect tutors using AI matching algorithms',
      category: 'App',
      stage: 'Prototype',
      targetUser: 'High school and college students struggling with specific subjects',
      problem: 'Finding the right tutor is time-consuming and often results in poor matches',
      solution: 'AI analyzes learning styles, subject needs, and tutor expertise to create perfect matches',
      differentiation: 'We use behavioral psychology + AI vs traditional search/filter approaches',
      monetization: 'Commission on tutor sessions (15%), premium features for students ($9.99/mo)',
      roadmap: 'Q1: Beta with 100 students\nQ2: Launch in 3 cities\nQ3: Scale to 10 cities',
      deckSlides: [],
      status: 'ACTIVE'
    });

    const idea3 = await Idea.create({
      founderId: founder2._id,
      title: 'GreenCommute',
      oneLineSummary: 'Gamified carpooling app that rewards eco-friendly commuting',
      category: 'App',
      stage: 'Idea',
      targetUser: 'Urban commuters aged 25-45 who care about the environment',
      problem: 'People want to carpool but lack motivation and convenient matching',
      solution: 'Gamification with points, leaderboards, and rewards for reducing carbon footprint',
      differentiation: 'We make carpooling fun and rewarding, not just practical',
      monetization: 'Freemium: free basic, $4.99/mo premium with bonus rewards',
      roadmap: 'Q1: MVP launch in Austin\nQ2: Add 5 cities\nQ3: Corporate partnerships',
      deckSlides: [],
      status: 'PENDING_REVIEW'
    });

    const idea4 = await Idea.create({
      founderId: founder2._id,
      title: 'CodeSnippet Pro',
      oneLineSummary: 'Beautiful code snippet sharing for developers with syntax highlighting',
      category: 'SaaS',
      stage: 'Launched',
      targetUser: 'Developers who share code on social media and documentation',
      problem: 'Code sharing on Twitter/LinkedIn looks ugly and unprofessional',
      solution: 'Create beautiful, branded code snippet images in seconds',
      differentiation: 'Better templates, custom branding, and API for automation',
      monetization: 'Free tier: 10 snippets/mo, Pro $9/mo: unlimited + API access',
      roadmap: 'Q1: Add video export\nQ2: Team collaboration\nQ3: VS Code extension',
      deckSlides: [],
      status: 'ACTIVE'
    });

    console.log('✅ Created 4 demo ideas');

    // Create AI credit balances for ideas
    console.log('💳 Setting up idea credit balances...');
    await IdeaAiBalance.create({
      ideaId: idea1._id,
      balance: 250
    });

    await IdeaAiBalance.create({
      ideaId: idea2._id,
      balance: 100
    });

    await IdeaAiBalance.create({
      ideaId: idea4._id,
      balance: 50
    });

    // Create some allocations (investor investments)
    console.log('📊 Creating credit allocations...');
    await AiCreditAllocation.create({
      ideaId: idea1._id,
      investorId: investor1._id,
      amount: 200
    });

    await AiCreditAllocation.create({
      ideaId: idea1._id,
      investorId: investor2._id,
      amount: 50
    });

    await AiCreditAllocation.create({
      ideaId: idea2._id,
      investorId: investor2._id,
      amount: 100
    });

    await AiCreditAllocation.create({
      ideaId: idea4._id,
      investorId: investor1._id,
      amount: 50
    });

    // Create investor idea statuses (saved/rejected)
    console.log('📝 Creating review statuses...');
    await InvestorIdeaStatus.create({
      investorId: investor1._id,
      ideaId: idea1._id,
      status: 'SAVED'
    });

    await InvestorIdeaStatus.create({
      investorId: investor1._id,
      ideaId: idea4._id,
      status: 'SAVED'
    });

    await InvestorIdeaStatus.create({
      investorId: investor2._id,
      ideaId: idea1._id,
      status: 'SAVED'
    });

    await InvestorIdeaStatus.create({
      investorId: investor2._id,
      ideaId: idea2._id,
      status: 'SAVED'
    });

    // Create some transaction history
    await AiCreditTransaction.create({
      fromUserId: investor1._id,
      ideaId: idea1._id,
      type: 'INVEST_IN_IDEA',
      amount: 200,
      memo: 'Investment in TechFlow AI'
    });

    await AiCreditTransaction.create({
      fromUserId: investor2._id,
      ideaId: idea1._id,
      type: 'INVEST_IN_IDEA',
      amount: 50,
      memo: 'Investment in TechFlow AI'
    });

    await AiCreditTransaction.create({
      fromUserId: investor2._id,
      ideaId: idea2._id,
      type: 'INVEST_IN_IDEA',
      amount: 100,
      memo: 'Investment in EduMatch'
    });

    console.log('\n✨ Demo data created successfully!\n');
    console.log('📋 Summary:');
    console.log('  • 4 users (2 founders, 2 investors)');
    console.log('  • 4 ideas (various stages)');
    console.log('  • 2 investor wallets with credits');
    console.log('  • 4 credit allocations');
    console.log('  • 4 saved idea statuses');
    console.log('  • 3 transactions\n');
    
    console.log('🔑 Login Credentials:');
    console.log('  Investor 1: john@example.com / demo123');
    console.log('  Investor 2: emily@example.com / demo123');
    console.log('  Founder 1: sarah@example.com / demo123');
    console.log('  Founder 2: alex@example.com / demo123\n');

    console.log('🌐 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

createDemoData();
