import express, { Response } from 'express';
import { Idea } from '../models/Idea';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

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
