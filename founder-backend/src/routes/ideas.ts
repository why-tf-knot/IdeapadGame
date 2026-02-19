import express, { Response } from 'express';
import { Types } from 'mongoose';
import { Idea } from '../models/Idea';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { authMiddleware, founderOnly, AuthRequest } from '../middleware/auth';

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// WIZARD FLOW
// ═══════════════════════════════════════════════════════════

router.post(
  '/generate-pitch',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { wizardAnswers } = req.body;

      if (!wizardAnswers?.step1 || !wizardAnswers?.step2 ||
          !wizardAnswers?.step3 || !wizardAnswers?.step4) {
        return res.status(400).json({ error: 'All 4 wizard steps are required' });
      }

      const generatedTitle = generatePitchTitle(wizardAnswers.step1);
      const pitchIdea = expandIdeaDescription(wizardAnswers.step1);
      const pitchTarget = expandTargetDescription(wizardAnswers.step2);
      const pitchSolves = expandChallengesDescription(wizardAnswers.step3);
      const pitchHow = expandSolutionDescription(wizardAnswers.step4);

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
        wizardStep1: wizardAnswers.step1,
        wizardStep2: wizardAnswers.step2,
        wizardStep3: wizardAnswers.step3,
        wizardStep4: wizardAnswers.step4,
        pitchTitle: generatedTitle,
        pitchIdea,
        pitchTarget,
        pitchSolves,
        pitchHow,
        pitchStatus: 'GENERATED',
      });

      await idea.save();

      await new IdeaAiBalance({ ideaId: idea._id, balance: 0 }).save();

      res.status(201).json({ idea });
    } catch (error) {
      console.error('Generate pitch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/:id/finalize',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(req.params.id);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });
      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only finalize your own ideas' });
      }

      const { pitchTitle, pitchIdea, pitchTarget, pitchSolves, pitchHow } = req.body;
      if (pitchTitle) { idea.pitchTitle = pitchTitle; idea.title = pitchTitle; }
      if (pitchIdea) idea.pitchIdea = pitchIdea;
      if (pitchTarget) idea.pitchTarget = pitchTarget;
      if (pitchSolves) idea.pitchSolves = pitchSolves;
      if (pitchHow) idea.pitchHow = pitchHow;

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

// ═══════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════

router.post(
  '/',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        title, oneLineSummary, category, stage, targetUser,
        problem, solution, differentiation, monetization, roadmap, deckSlides,
      } = req.body;

      if (!title || !oneLineSummary || !category || !stage || !targetUser ||
          !problem || !solution || !differentiation || !monetization || !roadmap) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      const idea = new Idea({
        founderId: req.userId,
        title, oneLineSummary, category, stage, targetUser,
        problem, solution, differentiation, monetization, roadmap,
        deckSlides: deckSlides || [],
        status: 'PENDING_REVIEW',
      });
      await idea.save();

      await new IdeaAiBalance({ ideaId: idea._id, balance: 0 }).save();

      res.status(201).json({ idea });
    } catch (error) {
      console.error('Create idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(req.params.id);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });
      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only update your own ideas' });
      }

      const fields = [
        'title', 'oneLineSummary', 'category', 'stage', 'targetUser',
        'problem', 'solution', 'differentiation', 'monetization', 'roadmap',
        'deckSlides', 'status',
      ];
      for (const f of fields) {
        if (req.body[f] !== undefined) (idea as any)[f] = req.body[f];
      }

      await idea.save();
      res.json({ idea });
    } catch (error) {
      console.error('Update idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/my',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const ideas = await Idea.find({ founderId: req.userId });

      const ideasWithBalances = await Promise.all(
        ideas.map(async (idea) => {
          const balance = await IdeaAiBalance.findOne({ ideaId: idea._id });
          return { ...idea.toObject(), aiCredits: balance?.balance || 0 };
        })
      );

      res.json({ ideas: ideasWithBalances });
    } catch (error) {
      console.error('Get my ideas error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(req.params.id).populate('founderId', 'name email');
      if (!idea) return res.status(404).json({ error: 'Idea not found' });

      const balance = await IdeaAiBalance.findOne({ ideaId: idea._id });
      res.json({ idea: { ...idea.toObject(), aiCredits: balance?.balance || 0 } });
    } catch (error) {
      console.error('Get idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ═══════════════════════════════════════════════════════════
// Placeholder AI generators
// ═══════════════════════════════════════════════════════════

function generatePitchTitle(s: string): string {
  const words = s.split(' ').filter(w => w.length > 3);
  const key = words.length > 0 ? words[0] : 'My';
  return `${key.charAt(0).toUpperCase() + key.slice(1)} – A Bold New Idea`;
}
function expandIdeaDescription(s: string): string {
  return `${s}\n\nThis innovative concept aims to transform the way people interact with technology, bringing a fresh perspective to an underserved market.`;
}
function expandTargetDescription(s: string): string {
  return `${s}\n\nThese users are actively looking for better solutions and represent a growing segment with increasing purchasing power and digital adoption.`;
}
function expandChallengesDescription(s: string): string {
  return `${s}\n\nBy tackling these pain points head-on, this idea provides measurable value and addresses gaps that current solutions fail to bridge.`;
}
function expandSolutionDescription(s: string): string {
  return `${s}\n\nThe implementation strategy focuses on rapid prototyping, user feedback loops, and iterative improvement to ensure product-market fit.`;
}

export default router;
