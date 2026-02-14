import express, { Response } from 'express';
import { ChatThread } from '../models/ChatThread';
import { Idea } from '../models/Idea';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create or get chat thread
router.post('/threads', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ideaId, investorId, founderId } = req.body;

    // Verify idea exists
    const idea = await Idea.findById(ideaId);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Find or create thread
    let thread = await ChatThread.findOne({ ideaId, investorId, founderId });

    if (!thread) {
      thread = new ChatThread({
        ideaId,
        investorId,
        founderId,
        messages: [],
      });
      await thread.save();
    }

    res.json({ thread });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's threads
router.get('/threads', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const threads = await ChatThread.find({
      $or: [{ investorId: req.userId }, { founderId: req.userId }],
    })
      .populate('ideaId', 'title')
      .populate('investorId', 'name')
      .populate('founderId', 'name')
      .sort({ updatedAt: -1 });

    res.json({ threads });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get thread by ID
router.get('/threads/:threadId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const thread = await ChatThread.findById(req.params.threadId)
      .populate('ideaId', 'title')
      .populate('investorId', 'name')
      .populate('founderId', 'name');

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Check if user is part of the thread
    const isParticipant =
      thread.investorId.toString() === req.userId?.toString() ||
      thread.founderId.toString() === req.userId?.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ thread });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message in thread
router.post('/threads/:threadId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const thread = await ChatThread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Check if user is part of the thread
    const isParticipant =
      thread.investorId.toString() === req.userId?.toString() ||
      thread.founderId.toString() === req.userId?.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add message
    thread.messages.push({
      senderId: req.userId!,
      text,
      createdAt: new Date(),
    });

    await thread.save();

    // In a real app, emit Socket.io event here
    // io.to(`thread-${thread._id}`).emit('newMessage', thread.messages[thread.messages.length - 1]);

    res.json({ message: thread.messages[thread.messages.length - 1] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
