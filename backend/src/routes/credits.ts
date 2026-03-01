// Helper: Map token type to the balance field on IdeaAiBalance
function ideaTokenField(tokenType: TokenType): string {
  const map: Record<TokenType, string> = {
    GEMINI: 'geminiBalance',
    ANTHROPIC: 'anthropicBalance',
    PERPLEXITY: 'perplexityBalance',
    CHATGPT: 'chatgptBalance',
  };
  return map[tokenType];
}
import express, { Response } from 'express';
import { Types } from 'mongoose';
import { AiCreditWallet, TOKEN_TYPES, TokenType, tokenBalanceField } from '../models/AiCreditWallet';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { AiCreditTransaction } from '../models/AiCreditTransaction';
import { Idea } from '../models/Idea';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { runAiTool } from '../services/aiService';
import aiCacheService from '../services/cacheService';
import analyticsService from '../services/analyticsService';

const router = express.Router();

// Exchange Prana for AI tokens (Investors only)
router.post(
  '/exchange',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, tokenType, exchangeRate } = req.body;

      // Validate input
      if (!amount || amount <= 0 || !Number.isInteger(amount)) {
        return res.status(400).json({ error: 'Valid integer Prana amount required' });
      }
      if (!tokenType || !TOKEN_TYPES.includes(tokenType)) {
        return res.status(400).json({ error: `Invalid tokenType. Must be one of: ${TOKEN_TYPES.join(', ')}` });
      }
      if (!exchangeRate || typeof exchangeRate !== 'number' || exchangeRate <= 0) {
        return res.status(400).json({ error: 'Valid exchangeRate required' });
      }

      // Find wallet
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Prana is stored in totalBalance (legacy field)
      if ((wallet.totalBalance || 0) < amount) {
        return res.status(400).json({ error: 'Insufficient Prana balance' });
      }

      // Calculate tokens to credit
      const tokensToCredit = Math.floor(amount * exchangeRate);
      if (tokensToCredit <= 0) {
        return res.status(400).json({ error: 'Exchange would result in zero tokens' });
      }

      // Atomic update
      const session = await (wallet as any).constructor.startSession();
      session.startTransaction();
      try {
        // Deduct Prana
        wallet.totalBalance -= amount;
      const router = express.Router(); // Keep this declaration
        const balField = tokenBalanceField(tokenType as TokenType);
        (wallet as any)[balField] = ((wallet as any)[balField] || 0) + tokensToCredit;
        await wallet.save({ session });

        // Log transaction
        const tx = new AiCreditTransaction({
          fromUserId: req.userId,
          toUserId: req.userId,
          type: 'EXCHANGE_PRANA',
          tokenType,
          amount: tokensToCredit,
          memo: `Exchanged ${amount} Prana for ${tokensToCredit} ${tokenType} tokens at rate ${exchangeRate}`,
        });
        await tx.save({ session });

        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }

      res.json({
        message: `Exchanged ${amount} Prana for ${tokensToCredit} ${tokenType} tokens`,
        newBalances: {
          prana: wallet.totalBalance,
          gemini: wallet.geminiBalance,
          anthropic: wallet.anthropicBalance,
          perplexity: wallet.perplexityBalance,
          chatgpt: wallet.chatgptBalance,
        },
        tokensCredited: tokensToCredit,
      });
    } catch (error) {
      console.error('Prana exchange error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);


// Get wallet info for current user
router.get(
  '/wallet/me',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Get recent transactions
      const transactions = await AiCreditTransaction.find({
        $or: [{ fromUserId: req.userId }, { toUserId: req.userId }],
      })
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        wallet: {
          balances: {
            gemini: wallet.geminiBalance,
            anthropic: wallet.anthropicBalance,
            perplexity: wallet.perplexityBalance,
            chatgpt: wallet.chatgptBalance,
          },
          // Keep legacy field for backward-compat
          balance: wallet.geminiBalance + wallet.anthropicBalance + wallet.perplexityBalance + wallet.chatgptBalance,
        },
        transactions,
      });
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Invest tokens in an idea (Investors only)
router.post(
  '/invest',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId, amount, tokenType } = req.body;

      if (!ideaId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid ideaId and amount are required' });
      }

      if (!Types.ObjectId.isValid(ideaId)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      if (!Number.isInteger(amount) || amount > 10000) {
        return res.status(400).json({ error: 'Amount must be an integer no greater than 10,000' });
      }

      // Validate token type
      if (!tokenType || !TOKEN_TYPES.includes(tokenType)) {
        return res.status(400).json({
          error: `Invalid tokenType. Must be one of: ${TOKEN_TYPES.join(', ')}`,
        });
      }

      // Check idea exists
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Get investor wallet
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Check sufficient balance for the specific token type
      const balField = tokenBalanceField(tokenType as TokenType);
      const currentBalance = wallet[balField] as number;
      if (currentBalance < amount) {
        return res.status(400).json({ error: `Insufficient ${tokenType} tokens` });
      }

      // Decrease wallet balance for this token
      (wallet as any)[balField] = currentBalance - amount;
      await wallet.save();

      // Increase idea balance for this token
      const incField = ideaTokenField(tokenType as TokenType);
      const ideaBalance = await IdeaAiBalance.findOneAndUpdate(
        { ideaId },
        { $inc: { [incField]: amount, balance: amount } },
        { upsert: true, new: true }
      );

      // Update or create allocation (per investor-idea-tokenType)
      await AiCreditAllocation.findOneAndUpdate(
        { investorId: req.userId, ideaId, tokenType },
        { $inc: { amount: amount } },
        { upsert: true, new: true }
      );

      // Create transaction record
      const transaction = new AiCreditTransaction({
        fromUserId: req.userId,
        toUserId: idea.founderId,
        ideaId,
        type: 'INVEST_IN_IDEA',
        tokenType,
        amount,
        memo: `${tokenType} tokens invested in ${idea.title}`,
      });
      await transaction.save();

      // Track analytics
      analyticsService.trackCreditsAllocated(ideaId, amount, req.userId!.toString());

      res.json({
        message: `${tokenType} tokens invested successfully`,
        newBalances: {
          gemini: wallet.geminiBalance,
          anthropic: wallet.anthropicBalance,
          perplexity: wallet.perplexityBalance,
          chatgpt: wallet.chatgptBalance,
        },
        ideaBalances: {
          gemini: ideaBalance.geminiBalance,
          anthropic: ideaBalance.anthropicBalance,
          perplexity: ideaBalance.perplexityBalance,
          chatgpt: ideaBalance.chatgptBalance,
        },
        // Legacy fields
        newBalance: (wallet as any)[balField],
        ideaBalance: (ideaBalance as any)[incField],
      });
    } catch (error) {
      analyticsService.trackError(error as Error, { 
        route: '/credits/invest',
        userId: req.userId?.toString() 
      });
      console.error('Invest credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get AI token balances for an idea
router.get(
  '/idea/:ideaId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId } = req.params;

      if (!Types.ObjectId.isValid(ideaId as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const ideaBalance = await IdeaAiBalance.findOne({ ideaId });
      const allocations = await AiCreditAllocation.find({ ideaId }).populate(
        'investorId',
        'name email'
      );

      res.json({
        balances: {
          gemini: ideaBalance?.geminiBalance || 0,
          anthropic: ideaBalance?.anthropicBalance || 0,
          perplexity: ideaBalance?.perplexityBalance || 0,
          chatgpt: ideaBalance?.chatgptBalance || 0,
        },
        // Legacy field
        balance: ideaBalance?.balance || 0,
        allocations: allocations.map((alloc) => ({
          investor: alloc.investorId,
          tokenType: alloc.tokenType,
          amount: alloc.amount,
        })),
      });
    } catch (error) {
      console.error('Get idea credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Spend tokens on AI service (Founders only)
router.post(
  '/spend',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId, amount, service, tokenType } = req.body;

      if (!ideaId || !amount || !service || amount <= 0) {
        return res.status(400).json({ error: 'Valid ideaId, amount, and service are required' });
      }

      if (!Types.ObjectId.isValid(ideaId)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      if (!Number.isInteger(amount) || amount > 10000) {
        return res.status(400).json({ error: 'Amount must be an integer no greater than 10,000' });
      }

      // Validate token type
      if (!tokenType || !TOKEN_TYPES.includes(tokenType)) {
        return res.status(400).json({
          error: `Invalid tokenType. Must be one of: ${TOKEN_TYPES.join(', ')}`,
        });
      }

      // Check idea exists and user owns it
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only spend tokens on your own ideas' });
      }

      // Get idea balance
      const ideaBalance = await IdeaAiBalance.findOne({ ideaId });
      const balFieldIdea = ideaTokenField(tokenType as TokenType);
      const currentIdeaBalance = ideaBalance ? (ideaBalance as any)[balFieldIdea] || 0 : 0;

      if (!ideaBalance || currentIdeaBalance < amount) {
        return res.status(400).json({ error: `Insufficient ${tokenType} tokens for this idea` });
      }

      // Check cache first
      const cachedResult = aiCacheService.get(ideaId, service);
      if (cachedResult) {
        console.log(`[AI Cache] Returning cached result for ${service} on idea ${ideaId}`);
        
        // Track analytics for cached response
        analyticsService.trackAiToolUsed(ideaId, service, amount, true);
        analyticsService.trackCacheHit(service, ideaId);
        
        return res.json({
          message: 'Tokens spent successfully (cached)',
          newBalances: {
            gemini: ideaBalance.geminiBalance,
            anthropic: ideaBalance.anthropicBalance,
            perplexity: ideaBalance.perplexityBalance,
            chatgpt: ideaBalance.chatgptBalance,
          },
          newBalance: currentIdeaBalance,
          result: cachedResult.text,
          tokensUsed: cachedResult.tokensUsed,
          tokenType,
          cached: true,
        });
      }

      // Track cache miss
      analyticsService.trackCacheMiss(service, ideaId);

      // Decrease idea balance for the specific token
      (ideaBalance as any)[balFieldIdea] = currentIdeaBalance - amount;
      ideaBalance.balance = Math.max(0, ideaBalance.balance - amount);
      await ideaBalance.save();

      // Create transaction record
      const transaction = new AiCreditTransaction({
        fromUserId: req.userId,
        ideaId,
        type: 'SPEND_ON_AI_SERVICE',
        tokenType,
        amount,
        memo: `${tokenType} tokens: ${service}`,
      });
      await transaction.save();

      // Call AI service (pass tokenType so it knows which provider to use)
      const aiServiceResult = await runAiTool(service, idea, tokenType as TokenType);

      // Cache the result for 1 hour
      aiCacheService.set(ideaId, service, aiServiceResult);

      // Track analytics for new AI request
      analyticsService.trackAiToolUsed(ideaId, service, amount, false);
      analyticsService.trackCreditsSpent(ideaId, amount, service, false);

      res.json({
        message: `${tokenType} tokens spent successfully`,
        newBalances: {
          gemini: ideaBalance.geminiBalance,
          anthropic: ideaBalance.anthropicBalance,
          perplexity: ideaBalance.perplexityBalance,
          chatgpt: ideaBalance.chatgptBalance,
        },
        newBalance: (ideaBalance as any)[balFieldIdea],
        result: aiServiceResult.text,
        tokensUsed: aiServiceResult.tokensUsed,
        tokenType,
        cached: false,
      });
    } catch (error) {
      console.error('Spend credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── Monthly Token Grant ──────────────────────────────────────
// Grant tokens to a single investor wallet. In production this would
// be called by a cron / scheduled function for every investor.

const MONTHLY_GRANT: Record<TokenType, number> = {
  GEMINI: 250,
  ANTHROPIC: 250,
  PERPLEXITY: 250,
  CHATGPT: 250,
};

router.post(
  '/grant',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Apply grant for each token type
      for (const tt of TOKEN_TYPES) {
        const field = tokenBalanceField(tt);
        (wallet as any)[field] = ((wallet as any)[field] || 0) + MONTHLY_GRANT[tt];
      }
      const totalGranted = Object.values(MONTHLY_GRANT).reduce((a, b) => a + b, 0);
      wallet.totalBalance += totalGranted;
      await wallet.save();

      // Record one transaction per token type
      for (const tt of TOKEN_TYPES) {
        const tx = new AiCreditTransaction({
          fromUserId: null,
          toUserId: req.userId,
          type: 'GRANT_TO_INVESTOR',
          tokenType: tt,
          amount: MONTHLY_GRANT[tt],
          memo: `Monthly ${tt} token grant`,
        });
        await tx.save();
      }

      analyticsService.trackEvent({
        name: 'monthly_grant',
        userId: req.userId!.toString(),
        properties: { totalGranted },
      });

      res.json({
        message: 'Monthly token grant applied',
        granted: MONTHLY_GRANT,
        newBalances: {
          gemini: wallet.geminiBalance,
          anthropic: wallet.anthropicBalance,
          perplexity: wallet.perplexityBalance,
          chatgpt: wallet.chatgptBalance,
        },
      });
    } catch (error) {
      console.error('Grant tokens error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
