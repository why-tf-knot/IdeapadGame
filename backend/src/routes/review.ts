import express, { Response } from 'express';
import { Idea } from '../models/Idea';
import { InvestorIdeaStatus } from '../models/InvestorIdeaStatus';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import analyticsService from '../services/analyticsService';

const router = express.Router();

// Get next idea to review (Investors only)
router.get(
  '/next',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      // Get all ideas that investor has already seen
      const seenStatuses = await InvestorIdeaStatus.find({
        investorId: req.userId,
        status: { $in: ['SAVED', 'REJECTED'] },
      });

      const seenIdeaIds = seenStatuses.map((status) => status.ideaId);

      // Find next idea not yet seen
      const nextIdea = await Idea.findOne({
        _id: { $nin: seenIdeaIds },
        status: { $in: ['PENDING_REVIEW', 'ACTIVE'] },
      })
        .sort({ createdAt: 1 }) // Oldest first
        .populate('founderId', 'name');

      if (!nextIdea) {
        return res.json({ idea: null, message: 'No more ideas to review' });
      }

      res.json({ idea: nextIdea });
    } catch (error) {
      console.error('Get next idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Save idea (Investors only)
router.post(
  '/:ideaId/save',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const ideaId = req.params.ideaId as string;

      // Check if idea exists
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Create or update status
      await InvestorIdeaStatus.findOneAndUpdate(
        { investorId: req.userId, ideaId },
        { status: 'SAVED' },
        { upsert: true, new: true }
      );

      // Update idea status to ACTIVE if it was PENDING_REVIEW
      if (idea.status === 'PENDING_REVIEW') {
        idea.status = 'ACTIVE';
        await idea.save();
      }

      // Track analytics
      analyticsService.trackIdeaReviewed(ideaId, 'saved');
      analyticsService.trackPaperToss(ideaId, 'save', 'swipe_right');

      res.json({ message: 'Idea saved successfully' });
    } catch (error) {
      analyticsService.trackError(error as Error, { 
        route: '/review/:ideaId/save',
        userId: req.userId?.toString() 
      });
      console.error('Save idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Reject idea (Investors only)
router.post(
  '/:ideaId/reject',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const ideaId = req.params.ideaId as string;

      // Check if idea exists
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Create or update status
      await InvestorIdeaStatus.findOneAndUpdate(
        { investorId: req.userId, ideaId },
        { status: 'REJECTED' },
        { upsert: true, new: true }
      );

      // Track analytics
      analyticsService.trackIdeaReviewed(ideaId, 'rejected');
      analyticsService.trackPaperToss(ideaId, 'reject', 'swipe_down');

      res.json({ message: 'Idea rejected' });
    } catch (error) {
      analyticsService.trackError(error as Error, { 
        route: '/review/:ideaId/reject',
        userId: req.userId?.toString() 
      });
      console.error('Reject idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get saved ideas (Investors only)
router.get(
  '/saved',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const savedStatuses = await InvestorIdeaStatus.find({
        investorId: req.userId,
        status: 'SAVED',
      }).populate('ideaId');

      const savedIdeas = savedStatuses
        .filter((status) => status.ideaId) // Filter out null ideas
        .map((status) => status.ideaId);

      res.json({ ideas: savedIdeas });
    } catch (error) {
      console.error('Get saved ideas error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
