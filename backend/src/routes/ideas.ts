
// Agent-specific AI suggestion/rephrase endpoint
import aiService from '../services/aiService';
router.post('/agent-suggest', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { service, ideaObj, userInput } = req.body;
    if (!service || !ideaObj) {
      return res.status(400).json({ error: 'Service and ideaObj are required' });
    }
    // If userInput is provided, use it as the main prompt (for rephrase)
    let promptIdea = { ...ideaObj };
    if (userInput) {
      // For rephrasing, override the relevant field with userInput
      // (Assume the field matches the service mapping in frontend)
      // This is a simplification; in production, map service to field
      promptIdea.oneLineSummary = userInput;
      promptIdea.targetUser = userInput;
      promptIdea.problem = userInput;
      promptIdea.solution = userInput;
      promptIdea.design = userInput;
      promptIdea.goToMarket = userInput;
      promptIdea.businessModel = userInput;
      promptIdea.roadmap = userInput;
    }
    const aiResult = await aiService.runAiTool(service, promptIdea, 'CHATGPT', req.userId);
    res.json({ text: aiResult.text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent suggestion' });
  }
});
import express, { Response } from 'express';
import { Types } from 'mongoose';
import { Idea } from '../models/Idea';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// ==========================================
// WIZARD FLOW: Generate Pitch from 4 steps
// ==========================================
// --- Enhanced: Use real AI provider for all 8 steps and generate image ---
import aiService from '../services/aiService';
import axios from 'axios';

router.post(
  '/generate-pitch',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { wizardAnswers, provider = 'CHATGPT' } = req.body;
      if (!Array.isArray(wizardAnswers) || wizardAnswers.length < 8) {
        return res.status(400).json({ error: 'All 8 wizard steps are required' });
      }

      // Compose idea object from wizard answers
      const [step1, step2, step3, step4, step5, step6, step7, step8] = wizardAnswers;
      const ideaObj = {
        title: step1,
        oneLineSummary: step1,
        targetUser: step2,
        problem: step3,
        solution: step4,
        design: step5,
        goToMarket: step6,
        businessModel: step7,
        roadmap: step8,
        category: 'Other',
        stage: 'Idea',
        differentiation: '',
        monetization: '',
      };

      // Call AI for each section
      const [pitchIdea, pitchTarget, pitchSolves, pitchHow, pitchDesign, pitchGoToMarket, pitchBusinessModel, pitchRoadmap] = await Promise.all([
        aiService.runAiTool('LLM_SUMMARY_IMPROVE', ideaObj, provider, req.userId).then(r => r.text),
        aiService.runAiTool('LLM_PITCH_DRAFT', ideaObj, provider, req.userId).then(r => r.text),
        aiService.runAiTool('LLM_PITCH_DRAFT', { ...ideaObj, problem: step3 }, provider, req.userId).then(r => r.text),
        aiService.runAiTool('LLM_PITCH_DRAFT', { ...ideaObj, solution: step4 }, provider, req.userId).then(r => r.text),
        aiService.runAiTool('LLM_PITCH_DRAFT', { ...ideaObj, design: step5 }, provider, req.userId).then(r => r.text),
        aiService.runAiTool('LLM_PITCH_DRAFT', { ...ideaObj, goToMarket: step6 }, provider, req.userId).then(r => r.text),
        aiService.runAiTool('LLM_PITCH_DRAFT', { ...ideaObj, businessModel: step7 }, provider, req.userId).then(r => r.text),
        aiService.runAiTool('LLM_ROADMAP_GENERATE', ideaObj, provider, req.userId).then(r => r.text),
      ]);

      // Generate image using the new endpoint
      let pitchImageUrl = '';
      try {
        const imageRes = await axios.post(
          `${process.env.IMAGE_GEN_URL || 'http://localhost:3000/api/image-gen/generate'}`,
          { prompt: `${step1} ${step5} ${step6}`, provider },
          { headers: { 'Authorization': req.headers['authorization'] || '' } }
        );
        pitchImageUrl = imageRes.data.imageUrl;
      } catch (err) {
        pitchImageUrl = '';
      }

      // Create the idea in DRAFT status
      const idea = new Idea({
        founderId: req.userId,
        title: step1,
        oneLineSummary: step1.substring(0, 250),
        category: 'Other',
        stage: 'Idea',
        targetUser: step2,
        problem: step3,
        solution: step4,
        design: step5,
        goToMarket: step6,
        businessModel: step7,
        roadmap: step8,
        status: 'DRAFT',
        // Wizard answers
        wizardStep1: step1,
        wizardStep2: step2,
        wizardStep3: step3,
        wizardStep4: step4,
        wizardStep5: step5,
        wizardStep6: step6,
        wizardStep7: step7,
        wizardStep8: step8,
        // AI-generated pitch
        pitchTitle: step1,
        pitchIdea,
        pitchTarget,
        pitchSolves,
        pitchHow,
        pitchDesign,
        pitchGoToMarket,
        pitchBusinessModel,
        pitchRoadmap,
        pitchImageUrl,
        pitchStatus: 'GENERATED',
      });

      await idea.save();

      // Create AI balance for idea
      const ideaBalance = new IdeaAiBalance({
        ideaId: idea._id,
        balance: 0,
      });
      await ideaBalance.save();

      res.status(201).json({ idea });
    } catch (error) {
      console.error('Generate pitch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ==========================================
// WIZARD FLOW: Finalize pitch (submit for review)
// ==========================================
router.post(
  '/:id/finalize',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(req.params.id);

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only finalize your own ideas' });
      }

      const { pitchTitle, pitchIdea, pitchTarget, pitchSolves, pitchHow } = req.body;

      // Update with potentially edited pitch data
      if (pitchTitle) idea.pitchTitle = pitchTitle;
      if (pitchTitle) idea.title = pitchTitle;
      if (pitchIdea) idea.pitchIdea = pitchIdea;
      if (pitchTarget) idea.pitchTarget = pitchTarget;
      if (pitchSolves) idea.pitchSolves = pitchSolves;
      if (pitchHow) idea.pitchHow = pitchHow;

      // Finalize — move to PENDING_REVIEW
      idea.pitchStatus = 'FINALIZED';
      idea.status = 'PENDING_REVIEW';

      await idea.save();

      res.json({ idea });
    } catch (error) {
      console.error('Finalize pitch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ==========================================
// AI Pitch Generation Helpers (placeholder)
// Replace with real AI provider later
// ==========================================
function generatePitchTitle(ideaSentence: string): string {
  // Extract key words to make a catchy title
  const words = ideaSentence.split(' ').filter(w => w.length > 3);
  const keyWord = words.length > 0 ? words[0] : 'My';
  return `${keyWord.charAt(0).toUpperCase() + keyWord.slice(1)} – A Bold New Idea`;
}

function expandIdeaDescription(step1: string): string {
  return `${step1}\n\nThis innovative concept aims to transform the way people interact with technology, bringing a fresh perspective to an underserved market.`;
}

function expandTargetDescription(step2: string): string {
  return `${step2}\n\nThese users are actively looking for better solutions and represent a growing segment with increasing purchasing power and digital adoption.`;
}

function expandChallengesDescription(step3: string): string {
  return `${step3}\n\nBy tackling these pain points head-on, this idea provides measurable value and addresses gaps that current solutions fail to bridge.`;
}

function expandSolutionDescription(step4: string): string {
  return `${step4}\n\nThe implementation strategy focuses on rapid prototyping, user feedback loops, and iterative improvement to ensure product-market fit.`;
}

// ==========================================
// EXISTING ROUTES (legacy / direct creation)
// ==========================================

// Create new idea (Founders only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        title,
        oneLineSummary,
        category,
        stage,
        targetUser,
        problem,
        solution,
        differentiation,
        monetization,
        roadmap,
        deckSlides,
      } = req.body;

      // Validate required fields
      if (!title || !oneLineSummary || !category || !stage || !targetUser || 
          !problem || !solution || !differentiation || !monetization || !roadmap) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      const idea = new Idea({
        founderId: req.userId,
        title,
        oneLineSummary,
        category,
        stage,
        targetUser,
        problem,
        solution,
        differentiation,
        monetization,
        roadmap,
        deckSlides: deckSlides || [],
        status: 'PENDING_REVIEW',
      });

      await idea.save();

      // Create AI balance for idea
      const ideaBalance = new IdeaAiBalance({
        ideaId: idea._id,
        balance: 0,
      });
      await ideaBalance.save();

      res.status(201).json({ idea });
    } catch (error) {
      console.error('Create idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update idea (Founders only, own ideas)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(req.params.id);

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Check ownership
      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only update your own ideas' });
      }

      // Update fields
      const {
        title,
        oneLineSummary,
        category,
        stage,
        targetUser,
        problem,
        solution,
        differentiation,
        monetization,
        roadmap,
        deckSlides,
        status,
      } = req.body;

      if (title) idea.title = title;
      if (oneLineSummary) idea.oneLineSummary = oneLineSummary;
      if (category) idea.category = category;
      if (stage) idea.stage = stage;
      if (targetUser) idea.targetUser = targetUser;
      if (problem) idea.problem = problem;
      if (solution) idea.solution = solution;
      if (differentiation) idea.differentiation = differentiation;
      if (monetization) idea.monetization = monetization;
      if (roadmap) idea.roadmap = roadmap;
      if (deckSlides) idea.deckSlides = deckSlides;
      if (status) idea.status = status;

      await idea.save();

      res.json({ idea });
    } catch (error) {
      console.error('Update idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get founder's own ideas
router.get(
  '/my',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const ideas = await Idea.find({ founderId: req.userId });
      
      // Get AI balances for each idea
      const ideasWithBalances = await Promise.all(
        ideas.map(async (idea) => {
          const balance = await IdeaAiBalance.findOne({ ideaId: idea._id });
          return {
            ...idea.toObject(),
            aiCredits: balance?.balance || 0,
          };
        })
      );

      res.json({ ideas: ideasWithBalances });
    } catch (error) {
      console.error('Get my ideas error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get idea by ID (for viewing details)
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(req.params.id).populate('founderId', 'name email');

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Get AI balance
      const balance = await IdeaAiBalance.findOne({ ideaId: idea._id });

      res.json({
        idea: {
          ...idea.toObject(),
          aiCredits: balance?.balance || 0,
        },
      });
    } catch (error) {
      console.error('Get idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
