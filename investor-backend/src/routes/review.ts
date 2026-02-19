import express, { Response } from 'express';
import { Types } from 'mongoose';
import { Idea } from '../models/Idea';
import { InvestorIdeaStatus } from '../models/InvestorIdeaStatus';
import { authMiddleware, investorOnly, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get next idea to review
router.get(
  '/next',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const seen = await InvestorIdeaStatus.find({
        investorId: req.userId,
        status: { $in: ['SAVED', 'REJECTED'] },
      });

      const seenIds = seen.map((s) => s.ideaId);

      const nextIdea = await Idea.findOne({
        _id: { $nin: seenIds },
        status: { $in: ['PENDING_REVIEW', 'ACTIVE'] },
      })
        .sort({ createdAt: 1 })
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

// Save idea
router.post(
  '/:ideaId/save',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId } = req.params;
      if (!Types.ObjectId.isValid(ideaId as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });

      await InvestorIdeaStatus.findOneAndUpdate(
        { investorId: req.userId, ideaId },
        { status: 'SAVED' },
        { upsert: true, new: true }
      );

      if (idea.status === 'PENDING_REVIEW') {
        idea.status = 'ACTIVE';
        await idea.save();
      }

      res.json({ message: 'Idea saved successfully' });
    } catch (error) {
      console.error('Save idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Reject idea
router.post(
  '/:ideaId/reject',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId } = req.params;
      if (!Types.ObjectId.isValid(ideaId as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });

      await InvestorIdeaStatus.findOneAndUpdate(
        { investorId: req.userId, ideaId },
        { status: 'REJECTED' },
        { upsert: true, new: true }
      );

      res.json({ message: 'Idea rejected' });
    } catch (error) {
      console.error('Reject idea error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get saved ideas
router.get(
  '/saved',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const saved = await InvestorIdeaStatus.find({
        investorId: req.userId,
        status: 'SAVED',
      }).populate('ideaId');

      const ideas = saved.filter((s) => s.ideaId).map((s) => s.ideaId);
      res.json({ ideas });
    } catch (error) {
      console.error('Get saved ideas error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
