/**
 * AI Service Integration — Multi-Provider
 * 
 * Supports four AI token types, each mapping to a real AI provider:
 *   GEMINI     → Google Gemini
 *   ANTHROPIC  → Anthropic Claude
 *   PERPLEXITY → Perplexity AI
 *   CHATGPT    → OpenAI ChatGPT
 *
 * Founders spend provider-specific tokens; the service routes
 * requests to the corresponding API when keys are configured.
 */

import { TokenType } from '../models/AiCreditWallet';

interface AIServiceInput {
  service: string;
  idea: any;
}

interface AIServiceResult {
  text: string;
  tokensUsed?: number;
  provider?: string;
}

/**
 * Sanitize user input to prevent prompt injection attacks
 */
function sanitizeInput(text: string, maxLength: number = 5000): string {
  if (!text) return '';
  
  return text
    .replace(/[<>{}]/g, '') // Remove potential injection characters
    .replace(/\n{3,}/g, '\n\n') // Limit excessive newlines
    .substring(0, maxLength) // Enforce length limit
    .trim();
}

// Service definitions with agent-specific prompts
const AI_SERVICES: Record<string, { name: string; promptTemplate: (idea: any) => string }> = {
  AGENT_BUSINESS: {
    name: 'Business Leader Advice',
    promptTemplate: (idea) => `
You are a world-class business leader and startup mentor. Give actionable business advice for this idea:

Title: ${sanitizeInput(idea.title, 200)}
One-line summary: ${sanitizeInput(idea.oneLineSummary, 200)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target user: ${sanitizeInput(idea.targetUser, 200)}
Business model: ${sanitizeInput(idea.monetization, 1000)}
Stage: ${sanitizeInput(idea.stage, 50)}

Give:
- 2-3 key business risks or opportunities
- 2-3 concrete next steps for the founder
- 1 strategic question the founder should consider

Be concise, practical, and founder-focused.
    `.trim(),
  },
  AGENT_SCIENCE: {
    name: 'Scientist/Technical Feedback',
    promptTemplate: (idea) => `
You are a top scientist or technical expert. Analyze this idea and provide scientific/technical feedback:

Title: ${sanitizeInput(idea.title, 200)}
One-line summary: ${sanitizeInput(idea.oneLineSummary, 200)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target user: ${sanitizeInput(idea.targetUser, 200)}
Stage: ${sanitizeInput(idea.stage, 50)}

Give:
- 2-3 technical challenges or unknowns
- 2-3 suggestions to improve technical feasibility
- 1 question to test the scientific soundness

Be clear, constructive, and evidence-based.
    `.trim(),
  },
  AGENT_MARKETING: {
    name: 'Marketing/Go-to-Market Advice',
    promptTemplate: (idea) => `
You are a world-class marketer. Give go-to-market and marketing advice for this idea:

Title: ${sanitizeInput(idea.title, 200)}
One-line summary: ${sanitizeInput(idea.oneLineSummary, 200)}
Target user: ${sanitizeInput(idea.targetUser, 200)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Stage: ${sanitizeInput(idea.stage, 50)}

Give:
- 2-3 marketing channels or tactics to try
- 2-3 ways to validate demand quickly
- 1 question to clarify the go-to-market plan

Be creative, actionable, and focused on early traction.
    `.trim(),
  },
  AGENT_DEVELOPER: {
    name: 'Software Developer Advice',
    promptTemplate: (idea) => `
You are a senior software developer. Give practical implementation advice for this idea:

Title: ${sanitizeInput(idea.title, 200)}
One-line summary: ${sanitizeInput(idea.oneLineSummary, 200)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Stage: ${sanitizeInput(idea.stage, 50)}
Roadmap: ${sanitizeInput(idea.roadmap, 1000)}

Give:
- 2-3 technical stack or architecture suggestions
- 2-3 first steps for building an MVP
- 1 warning about common pitfalls

Be specific, realistic, and founder-friendly.
    `.trim(),
  },
};

/**
 * Provider metadata (name, env-key, model defaults)
 */
const PROVIDERS: Record<TokenType, { name: string; envKey: string; model: string }> = {
  GEMINI: { name: 'Google Gemini', envKey: 'GEMINI_API_KEY', model: 'gemini-pro' },
  ANTHROPIC: { name: 'Anthropic Claude', envKey: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-4-20250514' },
  PERPLEXITY: { name: 'Perplexity AI', envKey: 'PERPLEXITY_API_KEY', model: 'sonar-medium-online' },
  CHATGPT: { name: 'OpenAI ChatGPT', envKey: 'OPENAI_API_KEY', model: 'gpt-4' },
};

/**
 * Process AI tool request with error boundary
 * 
 * @param service   - The AI service to use (e.g. LLM_SUMMARY_IMPROVE)
 * @param idea      - The idea object
 * @param tokenType - Which provider's tokens to consume
 * @returns AI-generated text response (falls back gracefully on error)
 */

import { getUserProviderApiKey } from './userAIKeyService';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export async function runAiTool(
  service: string,
  idea: any,
  tokenType: TokenType = 'CHATGPT',
  userId?: string
): Promise<AIServiceResult> {
  const serviceConfig = AI_SERVICES[service];
  if (!serviceConfig) {
    throw new Error(`Unknown AI service: ${service}`);
  }
  const provider = PROVIDERS[tokenType];
  try {
    const prompt = serviceConfig.promptTemplate(idea);

    // Prefer user's linked API key if available
    let apiKey: string | null = null;
    if (userId) {
      apiKey = await getUserProviderApiKey(userId, tokenType);
    }
    if (!apiKey && process.env[provider.envKey]) {
      apiKey = process.env[provider.envKey] as string;
    }


    if (apiKey) {
      return await callProvider(tokenType, prompt, apiKey);
    }
// Call the real provider API based on tokenType
async function callProvider(tokenType: TokenType, prompt: string, apiKey: string): Promise<AIServiceResult> {
  switch (tokenType) {
    case 'CHATGPT':
      return await callOpenAI(prompt, apiKey);
    case 'ANTHROPIC':
      return await callAnthropic(prompt, apiKey);
    case 'GEMINI':
      return await callGemini(prompt, apiKey);
    case 'PERPLEXITY':
      return await callPerplexity(prompt, apiKey);
    default:
      throw new Error('Unknown provider');
  }
}

async function callOpenAI(prompt: string, apiKey: string): Promise<AIServiceResult> {
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant for startup founders improving their pitches.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });
  return {
    text: completion.choices[0].message.content || '',
    tokensUsed: completion.usage?.total_tokens || 0,
    provider: 'OpenAI ChatGPT',
  };
}

async function callAnthropic(prompt: string, apiKey: string): Promise<AIServiceResult> {
  const anthropic = new Anthropic({ apiKey });
  const completion = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    temperature: 0.7,
    messages: [
      { role: 'user', content: prompt },
    ],
  });
  return {
    text: completion.content[0]?.text || '',
    tokensUsed: completion.usage?.input_tokens + completion.usage?.output_tokens,
    provider: 'Anthropic Claude',
  };
}

async function callGemini(prompt: string, apiKey: string): Promise<AIServiceResult> {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    text,
    tokensUsed: undefined,
    provider: 'Google Gemini',
  };
}

async function callPerplexity(prompt: string, apiKey: string): Promise<AIServiceResult> {
  const url = 'https://api.perplexity.ai/chat/completions';
  const response = await axios.post(url, {
    model: 'sonar-medium-online',
    messages: [
      { role: 'system', content: 'You are a helpful assistant for startup founders improving their pitches.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  const text = response.data.choices?.[0]?.message?.content || '';
  return {
    text,
    tokensUsed: response.data.usage?.total_tokens,
    provider: 'Perplexity AI',
  };
}

    // Placeholder responses for MVP
    const placeholderResponses = getPlaceholderResponse(service, idea, tokenType);
    return {
      text: placeholderResponses,
      tokensUsed: 0,
      provider: provider.name,
    };
  } catch (error) {
    console.error(`[AI Service] Error running ${service} via ${provider.name}:`, error);
    return {
      text: `${provider.name} service temporarily unavailable for "${serviceConfig.name}". Please try again in a few moments. Your ${tokenType} tokens have not been charged.`,
      tokensUsed: 0,
      provider: provider.name,
    };
  }
}

/**
 * Generate placeholder AI responses
 * These simulate what a real AI provider would generate
 */
function getPlaceholderResponse(service: string, idea: any, tokenType: TokenType = 'CHATGPT'): string {
  const providerLabel = PROVIDERS[tokenType].name;
  switch (service) {
    case 'LLM_SUMMARY_IMPROVE':
      return `${idea.title} - ${idea.solution.substring(0, 80)}${idea.solution.length > 80 ? '...' : ''} for ${idea.targetUser}.`;

    case 'LLM_PITCH_DRAFT':
      return `# ${idea.title} - 6-Slide Pitch Deck

**Slide 1: The Problem**
• ${idea.problem.split('.')[0]}.
• This affects ${idea.targetUser} significantly
• Current solutions are inadequate
Visual: Problem illustration showing pain points

**Slide 2: Our Solution**
• ${idea.solution.split('.')[0]}.
• Simple, effective, and scalable approach
• Built specifically for ${idea.targetUser}
Visual: Product screenshot or demo

**Slide 3: Market Opportunity**
• Target audience: ${idea.targetUser}
• Category: ${idea.category}
• Growing market with clear demand
Visual: Market size chart and user personas

**Slide 4: Competitive Advantage**
• ${idea.differentiation.split('.')[0]}.
• Unique positioning in ${idea.category} space
• Defensible through ${idea.stage === 'Idea' ? 'first-mover advantage' : 'proven traction'}
Visual: Competitive matrix showing positioning

**Slide 5: Business Model**
• ${idea.monetization.split('.')[0]}.
• Scalable and sustainable revenue
• Clear path to profitability
Visual: Revenue model diagram

**Slide 6: Roadmap & Next Steps**
• Current stage: ${idea.stage}
• ${idea.roadmap.split('.')[0]}.
• Seeking funding to accelerate growth
Visual: Timeline showing key milestones`;

    case 'LLM_ROADMAP_GENERATE':
      return `# 6-Month Development Roadmap for ${idea.title}

**Month 1: Foundation & Planning**
Milestones:
• Finalize product requirements and user stories
• Set up development environment and tools
• Create initial wireframes and design mockups
• Recruit core team members (if needed)

Key Metrics: Requirements completeness, team onboarding
Resources: 1-2 developers, 1 designer
Risks: Scope creep - mitigate with clear MVP definition

**Month 2: MVP Development**
Milestones:
• Build core features for ${idea.targetUser}
• Implement ${idea.solution.split('.')[0]}
• Set up basic backend infrastructure
• Create initial landing page

Key Metrics: Feature completion rate, code quality
Resources: 2-3 developers, infrastructure setup
Validation: Weekly user feedback sessions

**Month 3: Beta Testing**
Milestones:
• Launch closed beta with 10-20 users
• Implement feedback loop and analytics
• Fix critical bugs and usability issues
• Refine ${idea.monetization.split('.')[0]}

Key Metrics: User engagement, bug reports, NPS score
Resources: Support person, QA testing
Risks: Low user engagement - pivot features if needed

**Month 4: Public Launch Preparation**
Milestones:
• Implement ${idea.differentiation.split('.')[0]}
• Complete remaining MVP features
• Build marketing materials and content
• Set up customer support channels

Key Metrics: Feature completeness, performance metrics
Resources: Marketing support, DevOps
Validation: Beta user satisfaction >80%

**Month 5: Public Launch**
Milestones:
• Official product launch to ${idea.targetUser}
• Execute marketing campaign
• Monitor system performance and scale
• Onboard first paying customers

Key Metrics: User acquisition, conversion rate, revenue
Resources: Full team + marketing push
Risks: Technical issues - have rollback plan ready

**Month 6: Growth & Iteration**
Milestones:
• Analyze user data and optimize features
• Implement top user-requested features
• Scale infrastructure as needed
• Plan next phase features

Key Metrics: MRR growth, churn rate, engagement
Resources: Full team focused on growth
Validation: Product-market fit indicators

**Success Criteria:**
- 100+ active users by end of Month 6
- Core value proposition validated
- Clear path to ${idea.monetization}
- Ready for next funding round`;

    default:
      return `[${providerLabel}] AI-generated response for ${service} would appear here. The system has processed your request and allocated the ${tokenType} tokens accordingly.`;
  }
}

/**
 * Future: Integrate with OpenAI API
 * Uncomment and configure when ready to use real AI
 */
/*
async function callOpenAI(prompt: string): Promise<AIServiceResult> {
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for startup founders improving their pitches.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      text: completion.choices[0].message.content || '',
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}
*/

/**
 * Future: Add rate limiting
 */
export function checkRateLimit(userId: string): boolean {
  // TODO: Implement rate limiting logic
  // For now, allow all requests
  return true;
}

/**
 * Estimate token cost based on service complexity and provider
 */
export function estimateCreditCost(service: string, tokenType: TokenType = 'CHATGPT'): number {
  // Provider multipliers (some providers cost more for equivalents)
  const multipliers: Record<TokenType, number> = {
    GEMINI: 0.8,
    ANTHROPIC: 1.2,
    PERPLEXITY: 1.0,
    CHATGPT: 1.0,
  };

  const baseCosts: Record<string, number> = {
    LLM_SUMMARY_IMPROVE: 10,
    LLM_PITCH_DRAFT: 20,
    LLM_ROADMAP_GENERATE: 20,
  };

  const base = baseCosts[service] || 15;
  return Math.ceil(base * multipliers[tokenType]);
}

export default {
  runAiTool,
  checkRateLimit,
  estimateCreditCost,
  PROVIDERS,
};
