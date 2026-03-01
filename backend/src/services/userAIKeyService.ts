import { UserAIAccount } from '../models/UserAIAccount';
import { User } from '../models/User';
import { TokenType } from '../models/AiCreditWallet';

/**
 * Get a user's API key for a given provider, if linked
 */
export async function getUserProviderApiKey(userId: string, provider: TokenType): Promise<string | null> {
  const user = await User.findById(userId).populate('aiAccounts');
  if (!user || !user.aiAccounts) return null;
  // @ts-ignore
  const aiAccount = user.aiAccounts.find((acc) => acc.provider === provider);
  return aiAccount ? aiAccount.apiKey : null;
}
