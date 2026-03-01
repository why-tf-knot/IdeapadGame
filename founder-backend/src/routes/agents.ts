import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { Idea } from '../models/Idea';

const router = express.Router();

// Agent type definitions
type AgentType = 'business' | 'science' | 'marketing' | 'developer';

interface AgentConfig {
  name: string;
  systemPrompt: string;
}

// Agent system prompts for each specialized role
const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  business: {
    name: 'Business Leader',
    systemPrompt: `You are a world-class business leader and startup mentor with deep experience scaling companies from idea to IPO. Your role is to help founders:
- Identify key business risks and opportunities
- Develop compelling business models and revenue strategies
- Navigate market positioning and competitive dynamics
- Plan strategic growth milestones

Be direct, actionable, and founder-focused. Give specific next steps, not generic advice.`,
  },
  science: {
    name: 'Scientist',
    systemPrompt: `You are a top scientist and technical researcher with expertise across multiple domains. Your role is to help founders:
- Evaluate technical feasibility and scientific soundness
- Identify research gaps and evidence requirements
- Suggest validation approaches and experiments
- Challenge assumptions with data-driven thinking

Be rigorous, evidence-based, and constructive. Help founders strengthen the scientific foundation of their ideas.`,
  },
  marketing: {
    name: 'Marketer',
    systemPrompt: `You are a world-class marketer and growth expert who has launched dozens of successful products. Your role is to help founders:
- Develop compelling messaging and positioning
- Identify ideal customer segments and personas
- Plan go-to-market strategies and channels
- Design experiments to validate demand quickly

Be creative, tactical, and focused on early traction. Help founders find their first 100 customers.`,
  },
  developer: {
    name: 'Software Developer',
    systemPrompt: `You are a senior software developer and technical architect with experience building scalable systems. Your role is to help founders:
- Choose appropriate tech stacks and architectures
- Plan MVP development and feature prioritization
- Identify technical debt and scaling challenges
- Estimate timelines and resource requirements

Be practical, realistic, and founder-friendly. Help non-technical founders understand what it takes to build their product.`,
  },
};

// Simulate AI response (replace with real AI integration)
async function getAgentResponse(
  agentType: AgentType,
  message: string,
  ideaContext: any,
  conversationHistory: { role: string; content: string }[] = []
): Promise<string> {
  const config = AGENT_CONFIGS[agentType];
  
  // Build context from idea
  const ideaSummary = ideaContext ? `
Current idea context:
- Title: ${ideaContext.title || 'Untitled'}
- Summary: ${ideaContext.oneLineSummary || 'No summary'}
- Problem: ${ideaContext.problem || 'Not specified'}
- Solution: ${ideaContext.solution || 'Not specified'}
- Target User: ${ideaContext.targetUser || 'Not specified'}
- Stage: ${ideaContext.stage || 'Idea'}
` : '';

  // Build conversation context
  const historyText = conversationHistory.length > 0
    ? '\nPrevious conversation:\n' + conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    : '';

  // For now, return a simulated intelligent response
  // In production, this would call OpenAI/Anthropic/etc
  const responses: Record<AgentType, string[]> = {
    business: [
      `As your Business Leader, I've analyzed your idea and here are my thoughts:\n\n**Key Opportunities:**\n1. Your target market shows strong growth potential\n2. There's a clear monetization path through ${ideaContext?.monetization || 'subscription model'}\n\n**Risks to Address:**\n1. Competition from established players\n2. Customer acquisition costs in early stages\n\n**Recommended Next Steps:**\n1. Validate pricing with 10 potential customers\n2. Map out your first 90-day revenue milestones\n3. Identify your unfair advantage\n\nWhat aspect would you like to explore further?`,
      `Great question! From a business strategy perspective:\n\n${ideaContext?.title ? `For "${ideaContext.title}", ` : ''}I'd recommend focusing on unit economics first. Your path to profitability depends on:\n\n1. **Customer Lifetime Value (LTV)**: How much will each customer be worth over time?\n2. **Customer Acquisition Cost (CAC)**: What channels will you use to acquire customers cost-effectively?\n3. **Time to Break-Even**: When will each customer become profitable?\n\nWould you like to work through these numbers together?`,
    ],
    science: [
      `From a scientific perspective, let me analyze your idea:\n\n**Technical Feasibility Assessment:**\n✓ Core technology is proven\n⚠️ Some integration challenges to address\n\n**Key Technical Questions:**\n1. What evidence supports your core hypothesis?\n2. Have similar approaches been validated in adjacent fields?\n3. What would a minimum viable experiment look like?\n\n**Suggested Validation Steps:**\n1. Review existing literature and patents\n2. Identify key technical milestones\n3. Plan a small-scale proof of concept\n\nWhat specific technical aspect would you like to explore?`,
      `Interesting question! Let me apply some scientific rigor:\n\n**Hypothesis Testing Framework:**\nYour core assumption appears to be that ${ideaContext?.problem ? `"${ideaContext.problem}" can be solved` : 'this solution will work'}.\n\n**To validate this, consider:**\n1. **Control group**: What happens without your solution?\n2. **Measurable outcomes**: What metrics prove success?\n3. **Sample size**: How many users needed for significance?\n\nShall I help design an experiment to test your key assumptions?`,
    ],
    marketing: [
      `As your Marketer, here's my go-to-market analysis:\n\n**Target Customer Profile:**\n${ideaContext?.targetUser || 'Your ideal customer'} - let's get more specific!\n\n**Messaging Framework:**\n• **Pain Point**: "${ideaContext?.problem || 'The core problem'}"\n• **Value Prop**: "${ideaContext?.solution || 'Your unique solution'}"\n• **Proof Points**: [We need to develop these]\n\n**Channel Strategy (First 100 Customers):**\n1. 🎯 Direct outreach on LinkedIn\n2. 📧 Cold email to warm prospects\n3. 🗣️ Community engagement in relevant forums\n\nWant me to help craft your first outreach message?`,
      `Great marketing question! Here's my take:\n\n**Customer Acquisition Playbook:**\n\n**Phase 1: Manual & High-Touch (Months 1-3)**\n- Personal outreach to your network\n- 1:1 demos and feedback sessions\n- Build case studies from early users\n\n**Phase 2: Scalable Channels (Months 3-6)**\n- Content marketing (SEO + social)\n- Referral program for happy customers\n- Partnerships with complementary tools\n\n**Key Metrics to Track:**\n- Conversion rate per channel\n- CAC by channel\n- Viral coefficient\n\nWhich phase would you like to dive deeper on?`,
    ],
    developer: [
      `As your Software Developer advisor, here's my technical assessment:\n\n**Recommended Tech Stack:**\n• **Frontend**: React Native (cross-platform mobile)\n• **Backend**: Node.js + Express\n• **Database**: MongoDB (flexible schema for early iteration)\n• **Hosting**: AWS or Vercel for quick deployment\n\n**MVP Feature Priority:**\n1. 🟢 Core value prop feature\n2. 🟡 User authentication\n3. 🟡 Basic analytics\n4. 🔴 Advanced features (defer)\n\n**Development Timeline:**\n- Week 1-2: Core functionality\n- Week 3: User flows & authentication\n- Week 4: Testing & deployment\n\nWhat technical aspect would you like to explore?`,
      `Solid technical question! Let me break this down:\n\n**Architecture Considerations:**\n\n**For ${ideaContext?.title || 'your product'}:**\n\n1. **Start Simple**\n   - Monolithic architecture for MVP\n   - Don't over-engineer early\n   \n2. **Plan for Scale**\n   - Stateless services\n   - Database indexing strategy\n   - Caching layer ready\n\n3. **Common Pitfalls to Avoid:**\n   - ❌ Building before validating\n   - ❌ Premature optimization\n   - ❌ Too many features in v1\n\n**Realistic Timeline:**\nA solid MVP takes 4-8 weeks for a skilled developer.\n\nWant me to help prioritize your feature list?`,
    ],
  };

  // Get a contextual response based on the message
  const agentResponses = responses[agentType];
  const responseIndex = message.length % agentResponses.length;
  
  return agentResponses[responseIndex];
}

// POST /api/agents/chat - Conversational chat with an agent
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { agentType, ideaId, message, conversationHistory } = req.body;
    const userId = (req as any).userId;

    // Validate agent type
    if (!['business', 'science', 'marketing', 'developer'].includes(agentType)) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get idea context if provided
    let ideaContext = null;
    if (ideaId) {
      const idea = await Idea.findOne({ _id: ideaId, founderId: userId });
      if (idea) {
        ideaContext = {
          title: idea.title,
          oneLineSummary: idea.oneLineSummary,
          problem: idea.problem,
          solution: idea.solution,
          targetUser: idea.targetUser,
          monetization: idea.monetization,
          stage: idea.stage,
        };
      }
    }

    // Get agent response
    const responseText = await getAgentResponse(
      agentType as AgentType,
      message,
      ideaContext,
      conversationHistory || []
    );

    res.json({
      text: responseText,
      agentType,
      tokensUsed: Math.floor(responseText.length / 4), // Rough estimate
    });
  } catch (error: any) {
    console.error('[agents/chat] Error:', error);
    res.status(500).json({ error: 'Failed to get agent response' });
  }
});

// POST /api/agents/suggest - One-off suggestion (no conversation context)
router.post('/suggest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { agentType, ideaId, prompt } = req.body;
    const userId = (req as any).userId;

    // Validate agent type
    if (!['business', 'science', 'marketing', 'developer'].includes(agentType)) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    // Get idea context
    let ideaContext = null;
    if (ideaId) {
      const idea = await Idea.findOne({ _id: ideaId, founderId: userId });
      if (idea) {
        ideaContext = {
          title: idea.title,
          oneLineSummary: idea.oneLineSummary,
          problem: idea.problem,
          solution: idea.solution,
          targetUser: idea.targetUser,
          monetization: idea.monetization,
          stage: idea.stage,
        };
      }
    }

    const responseText = await getAgentResponse(
      agentType as AgentType,
      prompt || 'Please review my idea and provide your expert feedback.',
      ideaContext
    );

    res.json({
      text: responseText,
      agentType,
    });
  } catch (error: any) {
    console.error('[agents/suggest] Error:', error);
    res.status(500).json({ error: 'Failed to get suggestion' });
  }
});

export default router;
