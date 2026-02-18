import express, { Response } from 'express';
import { Types } from 'mongoose';
import { Idea } from '../models/Idea';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// ==========================================
// WIZARD FLOW: Generate Pitch from 4 steps
// ==========================================
router.post(
  '/generate-pitch',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { wizardAnswers } = req.body;

      if (!wizardAnswers?.step1 || !wizardAnswers?.step2 || 
          !wizardAnswers?.step3 || !wizardAnswers?.step4) {
        return res.status(400).json({ error: 'All 4 wizard steps are required' });
      }

      // Generate AI pitch from wizard answers
      // TODO: Replace with real AI generation (OpenAI/Anthropic)
      const generatedTitle = generatePitchTitle(wizardAnswers.step1);
      const pitchIdea = expandIdeaDescription(wizardAnswers.step1);
      const pitchTarget = expandTargetDescription(wizardAnswers.step2);
      const pitchSolves = expandChallengesDescription(wizardAnswers.step3);
      const pitchHow = expandSolutionDescription(wizardAnswers.step4);

      // Create the idea in DRAFT status
      const idea = new Idea({
        founderId: req.userId,
        title: generatedTitle,
        oneLineSummary: wizardAnswers.step1.substring(0, 250),
        category: 'Other',
        stage: 'Idea',
        targetUser: wizardAnswers.step2,
        problem: wizardAnswers.step3,
        solution: wizardAnswers.step4,
        differentiation: '',
        monetization: '',
        roadmap: '',
        status: 'DRAFT',
        // Wizard answers
        wizardStep1: wizardAnswers.step1,
        wizardStep2: wizardAnswers.step2,
        wizardStep3: wizardAnswers.step3,
        wizardStep4: wizardAnswers.step4,
        // AI-generated pitch
        pitchTitle: generatedTitle,
        pitchIdea,
        pitchTarget,
        pitchSolves,
        pitchHow,
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
