/**
 * Credit Transfer Routes
 *
 * Central API for all cross-service credit movements.
 * Called by:
 *   - investor-backend  (invest tokens → idea)
 *   - founder-backend   (spend idea tokens → AI)
 *   - system            (monthly grants)
 *
 * Service-to-service calls use X-Service-Secret header.
 * User-facing queries use JWT auth.
 */

import express, { Response } from 'express';
import { Types } from 'mongoose';
import { CreditTransfer, TOKEN_TYPES } from '../models/CreditTransfer';
import { authMiddleware, AuthRequest, serviceAuthMiddleware } from '../middleware/auth';
import creditTransferService, {
  TransferRequest,
} from '../services/creditTransferService';

const router = express.Router();

// ─── Service-to-service: Initiate transfer ───────────────
router.post('/initiate', serviceAuthMiddleware, async (req: any, res: Response) => {
  try {
    const {
      type, tokenType, amount,
      fromUserId, toUserId, ideaId,
      initiatedBy, memo, metadata, idempotencyKey,
    } = req.body;

    if (!type || !tokenType || !amount || !initiatedBy || !memo) {
      return res.status(400).json({ error: 'Missing required fields: type, tokenType, amount, initiatedBy, memo' });
    }

    const result = await creditTransferService.initiateTransfer({
      type,
      tokenType,
      amount,
      fromUserId,
      toUserId,
      ideaId,
      initiatedBy,
      memo,
      metadata,
      idempotencyKey,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ transfer: result.transfer });
  } catch (error) {
    console.error('Initiate transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Service-to-service: Complete transfer ───────────────
router.post('/complete', serviceAuthMiddleware, async (req: any, res: Response) => {
  try {
    const { transferId } = req.body;
    if (!transferId) {
      return res.status(400).json({ error: 'transferId is required' });
    }

    const result = await creditTransferService.completeTransfer(transferId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ transfer: result.transfer });
  } catch (error) {
    console.error('Complete transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Service-to-service: Fail transfer ───────────────────
router.post('/fail', serviceAuthMiddleware, async (req: any, res: Response) => {
  try {
    const { transferId, reason } = req.body;
    if (!transferId || !reason) {
      return res.status(400).json({ error: 'transferId and reason are required' });
    }

    const result = await creditTransferService.failTransfer(transferId, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ transfer: result.transfer });
  } catch (error) {
    console.error('Fail transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Service-to-service: Reverse transfer ────────────────
router.post('/reverse', serviceAuthMiddleware, async (req: any, res: Response) => {
  try {
    const { transferId, reason } = req.body;
    if (!transferId || !reason) {
      return res.status(400).json({ error: 'transferId and reason are required' });
    }

    const result = await creditTransferService.reverseTransfer(transferId, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ transfer: result.transfer });
  } catch (error) {
    console.error('Reverse transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── User-facing: My transfer history ────────────────────
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const type = req.query.type as string | undefined;

    const transfers = await creditTransferService.getTransferHistory({
      userId: req.userId?.toString(),
      type: type as any,
      limit,
    });

    res.json({ transfers });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── User-facing: Idea transfer history ──────────────────
router.get('/idea/:ideaId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ideaId } = req.params;
    if (!Types.ObjectId.isValid(ideaId as string)) {
      return res.status(400).json({ error: 'Invalid idea ID format' });
    }

    const transfers = await creditTransferService.getTransferHistory({
      ideaId: ideaId as string,
      limit: 50,
    });

    res.json({ transfers });
  } catch (error) {
    console.error('Get idea transfers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Service-to-service: Get transfer by ID ──────────────
router.get('/transfer/:transferId', serviceAuthMiddleware, async (req: any, res: Response) => {
  try {
    const transfer = await CreditTransfer.findOne({ transferId: req.params.transferId });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    res.json({ transfer });
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
