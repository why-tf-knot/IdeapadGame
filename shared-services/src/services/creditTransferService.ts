/**
 * Credit Transfer Service
 *
 * Central authority for all cross-service credit movements.
 * Implements a simple two-phase commit:
 *   1. PENDING  — transfer record created, funds reserved
 *   2. COMPLETED — both sides acknowledged, transfer finalized
 *
 * If any step fails the transfer is marked FAILED and can be retried.
 */

import { CreditTransfer, ICreditTransfer, TokenType, TOKEN_TYPES, TransferType } from '../models/CreditTransfer';
import { generateTransferId, generateCorrelationId } from './encryptionService';

export interface TransferRequest {
  type: TransferType;
  tokenType: TokenType;
  amount: number;
  fromUserId?: string;
  toUserId?: string;
  ideaId?: string;
  initiatedBy: 'founder-backend' | 'investor-backend' | 'system';
  memo: string;
  metadata?: Record<string, any>;
  /** Optional client-supplied idempotency key */
  idempotencyKey?: string;
}

export interface TransferResult {
  success: boolean;
  transfer?: ICreditTransfer;
  error?: string;
}

/**
 * Initiate a new credit transfer.
 * Idempotent — if the same idempotencyKey is reused, returns the existing transfer.
 */
export async function initiateTransfer(req: TransferRequest): Promise<TransferResult> {
  try {
    // Validate token type
    if (!TOKEN_TYPES.includes(req.tokenType)) {
      return { success: false, error: `Invalid tokenType: ${req.tokenType}` };
    }
    if (req.amount <= 0 || !Number.isInteger(req.amount)) {
      return { success: false, error: 'Amount must be a positive integer' };
    }

    const transferId = req.idempotencyKey || generateTransferId();
    const correlationId = generateCorrelationId();

    // Idempotency check
    const existing = await CreditTransfer.findOne({ transferId });
    if (existing) {
      return { success: true, transfer: existing };
    }

    const transfer = new CreditTransfer({
      transferId,
      type: req.type,
      status: 'PENDING',
      tokenType: req.tokenType,
      amount: req.amount,
      fromUserId: req.fromUserId || null,
      toUserId: req.toUserId || null,
      ideaId: req.ideaId || null,
      initiatedBy: req.initiatedBy,
      correlationId,
      memo: req.memo,
      metadata: req.metadata,
    });

    await transfer.save();
    return { success: true, transfer };
  } catch (error: any) {
    console.error('[CreditTransfer] Initiate failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete a pending transfer (called after both services acknowledge).
 */
export async function completeTransfer(transferId: string): Promise<TransferResult> {
  try {
    const transfer = await CreditTransfer.findOne({ transferId });
    if (!transfer) {
      return { success: false, error: 'Transfer not found' };
    }
    if (transfer.status === 'COMPLETED') {
      return { success: true, transfer }; // Already done
    }
    if (transfer.status !== 'PENDING') {
      return { success: false, error: `Cannot complete transfer in status: ${transfer.status}` };
    }

    transfer.status = 'COMPLETED';
    transfer.completedAt = new Date();
    await transfer.save();

    return { success: true, transfer };
  } catch (error: any) {
    console.error('[CreditTransfer] Complete failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a transfer as failed.
 */
export async function failTransfer(transferId: string, reason: string): Promise<TransferResult> {
  try {
    const transfer = await CreditTransfer.findOne({ transferId });
    if (!transfer) {
      return { success: false, error: 'Transfer not found' };
    }

    transfer.status = 'FAILED';
    transfer.memo = `${transfer.memo} | FAILED: ${reason}`;
    await transfer.save();

    return { success: true, transfer };
  } catch (error: any) {
    console.error('[CreditTransfer] Fail record failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reverse a completed transfer (creates a balancing REFUND entry).
 */
export async function reverseTransfer(transferId: string, reason: string): Promise<TransferResult> {
  try {
    const original = await CreditTransfer.findOne({ transferId });
    if (!original) {
      return { success: false, error: 'Original transfer not found' };
    }
    if (original.status !== 'COMPLETED') {
      return { success: false, error: 'Only completed transfers can be reversed' };
    }

    // Mark original as reversed
    original.status = 'REVERSED';
    await original.save();

    // Create refund record
    const refund = await initiateTransfer({
      type: 'REFUND',
      tokenType: original.tokenType,
      amount: original.amount,
      fromUserId: original.toUserId?.toString(),
      toUserId: original.fromUserId?.toString(),
      ideaId: original.ideaId?.toString(),
      initiatedBy: 'system',
      memo: `Refund of ${original.transferId}: ${reason}`,
      metadata: { originalTransferId: original.transferId },
    });

    if (refund.success && refund.transfer) {
      await completeTransfer(refund.transfer.transferId);
    }

    return refund;
  } catch (error: any) {
    console.error('[CreditTransfer] Reverse failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Query transfer history for a user or idea.
 */
export async function getTransferHistory(opts: {
  userId?: string;
  ideaId?: string;
  type?: TransferType;
  limit?: number;
}): Promise<ICreditTransfer[]> {
  const query: any = {};

  if (opts.userId) {
    query.$or = [{ fromUserId: opts.userId }, { toUserId: opts.userId }];
  }
  if (opts.ideaId) {
    query.ideaId = opts.ideaId;
  }
  if (opts.type) {
    query.type = opts.type;
  }

  return CreditTransfer.find(query)
    .sort({ createdAt: -1 })
    .limit(opts.limit || 50);
}

export default {
  initiateTransfer,
  completeTransfer,
  failTransfer,
  reverseTransfer,
  getTransferHistory,
};
