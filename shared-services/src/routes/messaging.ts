/**
 * Secure Messaging Routes
 *
 * All messages are encrypted at rest using AES-256-CBC.
 * Each thread has a derived encryption key unique to the
 * founder + investor + idea combination.
 *
 * Both founder-app and investor-app talk to these endpoints
 * using their regular JWT auth tokens.
 */

import express, { Response } from 'express';
import { Types } from 'mongoose';
import { SecureChatThread } from '../models/SecureChatThread';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  deriveThreadKey,
  encryptMessage,
  decryptMessage,
} from '../services/encryptionService';
import { io } from '../server';

const router = express.Router();

// ─── Create or get a thread ─────────────────────────────
router.post('/threads', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ideaId, investorId, founderId } = req.body;

    if (!ideaId || !Types.ObjectId.isValid(ideaId)) {
      return res.status(400).json({ error: 'Valid ideaId is required' });
    }
    if (!investorId || !Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ error: 'Valid investorId is required' });
    }
    if (!founderId || !Types.ObjectId.isValid(founderId)) {
      return res.status(400).json({ error: 'Valid founderId is required' });
    }

    // Caller must be one of the participants
    const callerIsParticipant =
      req.userId?.toString() === investorId || req.userId?.toString() === founderId;
    if (!callerIsParticipant) {
      return res.status(403).json({ error: 'You must be a participant to create a thread' });
    }

    // Derive thread encryption key
    const threadKey = deriveThreadKey(ideaId, founderId, investorId);

    let thread = await SecureChatThread.findOne({ ideaId, investorId, founderId });

    if (!thread) {
      thread = new SecureChatThread({
        ideaId,
        investorId,
        founderId,
        threadKey,
        messages: [],
        lastActivity: new Date(),
      });
      await thread.save();
    }

    // Return thread metadata (never expose threadKey to clients)
    res.json({
      thread: {
        _id: thread._id,
        ideaId: thread.ideaId,
        founderId: thread.founderId,
        investorId: thread.investorId,
        messageCount: thread.messages.length,
        founderUnread: thread.founderUnread,
        investorUnread: thread.investorUnread,
        lastActivity: thread.lastActivity,
        isActive: thread.isActive,
        createdAt: thread.createdAt,
      },
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── List user's threads ─────────────────────────────────
router.get('/threads', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const threads = await SecureChatThread.find({
      $or: [{ investorId: req.userId }, { founderId: req.userId }],
      isActive: true,
    })
      .select('-messages -threadKey')
      .populate('founderId', 'name')
      .populate('investorId', 'name')
      .sort({ lastActivity: -1 });

    res.json({ threads });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get thread messages (decrypted) ─────────────────────
router.get('/threads/:threadId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.threadId as string)) {
      return res.status(400).json({ error: 'Invalid thread ID format' });
    }

    const thread = await SecureChatThread.findById(req.params.threadId)
      .populate('founderId', 'name')
      .populate('investorId', 'name');

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Authorization: only participants can read
    const isFounder = thread.founderId._id?.toString() === req.userId?.toString()
      || (thread.founderId as any).toString() === req.userId?.toString();
    const isInvestor = thread.investorId._id?.toString() === req.userId?.toString()
      || (thread.investorId as any).toString() === req.userId?.toString();

    if (!isFounder && !isInvestor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Decrypt messages for delivery
    const decryptedMessages = thread.messages.map((msg) => {
      try {
        const plaintext = decryptMessage(
          msg.encryptedText,
          msg.iv,
          msg.hash,
          thread.threadKey
        );
        return {
          _id: (msg as any)._id,
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          text: plaintext,
          read: msg.read,
          createdAt: msg.createdAt,
        };
      } catch (err) {
        return {
          _id: (msg as any)._id,
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          text: '[Message could not be decrypted]',
          read: msg.read,
          createdAt: msg.createdAt,
        };
      }
    });

    // Mark messages as read for the reader
    if (isFounder && thread.founderUnread > 0) {
      thread.founderUnread = 0;
      await thread.save();
    } else if (isInvestor && thread.investorUnread > 0) {
      thread.investorUnread = 0;
      await thread.save();
    }

    res.json({
      thread: {
        _id: thread._id,
        ideaId: thread.ideaId,
        founderId: thread.founderId,
        investorId: thread.investorId,
        lastActivity: thread.lastActivity,
        isActive: thread.isActive,
      },
      messages: decryptedMessages,
    });
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Send a message (encrypted at rest) ──────────────────
router.post('/threads/:threadId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!Types.ObjectId.isValid(req.params.threadId as string)) {
      return res.status(400).json({ error: 'Invalid thread ID format' });
    }
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Message must be 5000 characters or less' });
    }

    const thread = await SecureChatThread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    if (!thread.isActive) {
      return res.status(400).json({ error: 'Thread is closed' });
    }

    // Authorization
    const isFounder = thread.founderId.toString() === req.userId?.toString();
    const isInvestor = thread.investorId.toString() === req.userId?.toString();

    if (!isFounder && !isInvestor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Encrypt the message
    const { encryptedText, iv, hash } = encryptMessage(text, thread.threadKey);

    const senderRole = isFounder ? 'FOUNDER' : 'INVESTOR';

    thread.messages.push({
      senderId: req.userId!,
      senderRole: senderRole as 'FOUNDER' | 'INVESTOR',
      encryptedText,
      iv,
      hash,
      read: false,
      createdAt: new Date(),
    });

    // Update unread counts
    if (isFounder) {
      thread.investorUnread += 1;
    } else {
      thread.founderUnread += 1;
    }
    thread.lastActivity = new Date();

    await thread.save();

    const lastMsg = thread.messages[thread.messages.length - 1];

    const messagePayload = {
      _id: (lastMsg as any)._id,
      senderId: lastMsg.senderId,
      senderRole: lastMsg.senderRole,
      text, // plaintext
      read: false,
      createdAt: lastMsg.createdAt,
    };

    // Emit real-time event to thread participants
    io.to(`thread:${req.params.threadId}`).emit('new_message', {
      threadId: req.params.threadId,
      message: messagePayload,
    });

    // Also notify the recipient user room (for unread badge updates)
    const recipientId = isFounder ? thread.investorId.toString() : thread.founderId.toString();
    io.to(`user:${recipientId}`).emit('thread_updated', {
      threadId: req.params.threadId,
      unread: isFounder ? thread.investorUnread : thread.founderUnread,
    });

    res.json({ message: messagePayload });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Mark thread as read ─────────────────────────────────
router.post('/threads/:threadId/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.threadId as string)) {
      return res.status(400).json({ error: 'Invalid thread ID format' });
    }

    const thread = await SecureChatThread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const isFounder = thread.founderId.toString() === req.userId?.toString();
    const isInvestor = thread.investorId.toString() === req.userId?.toString();

    if (!isFounder && !isInvestor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (isFounder) {
      thread.founderUnread = 0;
    } else {
      thread.investorUnread = 0;
    }
    await thread.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
