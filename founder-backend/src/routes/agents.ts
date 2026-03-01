import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { Idea } from '../models/Idea';
import { runAiTool } from '../services/aiService';

const router = express.Router();

// Agent type definitions
type AgentType = 'business' | 'science' | 'marketing' | 'developer';

// Map agent types to AI service names
const AGENT_SERVICE_MAP: Record<AgentType, string> = {
  business: 'AGENT_BUSINESS',
  science: 'AGENT_SCIENCE',
  marketing: 'AGENT_MARKETING',
  developer: 'AGENT_DEVELOPER',
};

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
    let ideaContext: any = {
      title: 'My Idea',
      problem: 'A problem to solve',
      solution: 'An innovative solution',
      targetUser: 'Target customers',
      monetization: 'Revenue model',
      stage: 'Idea',
    };
    
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
          differentiation: idea.differentiation,
          stage: idea.stage,
        };
      }
    }

    // Get agent response using AI service
    const serviceName = AGENT_SERVICE_MAP[agentType as AgentType];
    const result = await runAiTool(serviceName, ideaContext, 'CHATGPT', message);

    res.json({
      text: result.text,
      agentType,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
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
    let ideaContext: any = {
      title: 'My Idea',
      problem: 'A problem to solve',
      solution: 'An innovative solution',
      targetUser: 'Target customers',
      monetization: 'Revenue model',
      stage: 'Idea',
    };
    
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
          differentiation: idea.differentiation,
          stage: idea.stage,
        };
      }
    }

    const message = prompt || 'Please review my idea and provide your expert feedback.';
    const serviceName = AGENT_SERVICE_MAP[agentType as AgentType];
    const result = await runAiTool(serviceName, ideaContext, 'CHATGPT', message);

    res.json({
      text: result.text,
      agentType,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error('[agents/suggest] Error:', error);
    res.status(500).json({ error: 'Failed to get suggestion' });
  }
});

// POST /api/agents/pitch-deck - Generate Red Bull Basement style pitch deck
router.post('/pitch-deck', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ideaId } = req.body;
    const userId = (req as any).userId;

    // Get idea context
    let ideaContext: any = {
      title: 'My Startup Idea',
      problem: 'A significant problem affecting many people',
      solution: 'An innovative and scalable solution',
      targetUser: 'Target market and customers',
      monetization: 'Sustainable business model',
      differentiation: 'Unique competitive advantage',
      stage: 'Idea',
    };
    
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
          differentiation: idea.differentiation,
          stage: idea.stage,
        };
      }
    }

    // Generate pitch deck using AI service
    const result = await runAiTool('PITCH_DECK_GENERATE', ideaContext, 'CHATGPT');
    
    // Parse the JSON response
    let pitchDeck;
    try {
      pitchDeck = JSON.parse(result.text);
    } catch {
      // If parsing fails, create structured response from raw text
      pitchDeck = {
        title: ideaContext.title,
        theIdea: ideaContext.solution || result.text,
        theTarget: ideaContext.targetUser,
        whatItSolves: ideaContext.problem,
        howItWorks: `${ideaContext.differentiation || ''} ${ideaContext.monetization || ''}`.trim(),
      };
    }

    res.json({
      pitchDeck,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error('[agents/pitch-deck] Error:', error);
    res.status(500).json({ error: 'Failed to generate pitch deck' });
  }
});

export default router;
