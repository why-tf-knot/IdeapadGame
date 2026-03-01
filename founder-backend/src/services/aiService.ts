/**
 * AI Service — multi-provider LLM integration for founder tools.
 * Supports Gemini, Anthropic (Claude), Perplexity, and OpenAI.
 * Falls back to placeholder responses when API keys are not configured.
 */

import axios from 'axios';

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT', 'MISTRAL', 'DEEPSEEK', 'GROK', 'LLAMA'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

interface AIServiceResult {
  text: string;
  tokensUsed?: number;
  provider?: string;
}

function sanitizeInput(text: string, maxLength: number = 5000): string {
  if (!text) return '';
  return text.replace(/[<>{}]/g, '').replace(/\n{3,}/g, '\n\n').substring(0, maxLength).trim();
}

const AI_SERVICES: Record<string, { name: string; promptTemplate: (idea: any, userMessage?: string) => string }> = {
  LLM_SUMMARY_IMPROVE: {
    name: 'Summary Improvement',
    promptTemplate: (idea) => `
You are an expert pitch consultant. Improve the following one-line pitch summary to be more compelling and concise (max 140 characters):
Current summary: "${sanitizeInput(idea.oneLineSummary, 200)}"
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target user: ${sanitizeInput(idea.targetUser, 200)}
Provide an improved one-line summary that is concise, compelling, and clearly communicates the value proposition.
Return only the improved summary, nothing else.`.trim(),
  },
  LLM_PITCH_DRAFT: {
    name: 'Pitch Deck Structure',
    promptTemplate: (idea) => `
You are a pitch deck expert. Create a 6-slide pitch deck structure for:
Title: ${sanitizeInput(idea.title, 200)}
Category: ${sanitizeInput(idea.category, 100)}
Stage: ${sanitizeInput(idea.stage, 50)}
Target User: ${sanitizeInput(idea.targetUser, 200)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Differentiation: ${sanitizeInput(idea.differentiation, 1000)}
Monetization: ${sanitizeInput(idea.monetization, 1000)}
For each slide provide a title, 2-3 bullets, and a visual suggestion.`.trim(),
  },
  LLM_ROADMAP_GENERATE: {
    name: 'Roadmap Generation',
    promptTemplate: (idea) => `
Create a 3-6 month development roadmap for:
Title: ${sanitizeInput(idea.title, 200)}
Category: ${sanitizeInput(idea.category, 100)}
Current Stage: ${sanitizeInput(idea.stage, 50)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Current Roadmap: ${sanitizeInput(idea.roadmap, 1000)}
Include milestones, resources, metrics, and risks per month.`.trim(),
  },

  // ═══════════════════════════════════════════════════════════
  // SPECIALIZED AGENT PROMPTS — For founder support agents
  // ═══════════════════════════════════════════════════════════
  
  AGENT_BUSINESS: {
    name: 'Business Leader Agent',
    promptTemplate: (idea, userMessage) => `You are an elite business strategist and startup mentor who has helped scale multiple unicorns. Your expertise:
- Business model innovation and revenue strategy
- Market positioning and competitive analysis
- Unit economics and financial planning
- Fundraising and investor relations

COMMUNICATION STYLE:
- Be direct and actionable — founders are busy
- Use frameworks (numbered lists, bullet points)
- Challenge assumptions constructively
- Give specific examples when possible
- End with a clear next step or question

FOUNDER'S IDEA:
Title: ${sanitizeInput(idea.title, 200)}
One-liner: ${sanitizeInput(idea.oneLineSummary, 300)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target User: ${sanitizeInput(idea.targetUser, 300)}
Business Model: ${sanitizeInput(idea.monetization, 500)}
Stage: ${sanitizeInput(idea.stage, 50)}

FOUNDER'S QUESTION:
${sanitizeInput(userMessage || 'Please analyze my business model and give strategic advice.', 2000)}

Give helpful, specific business advice:`.trim(),
  },

  AGENT_SCIENCE: {
    name: 'Scientist Agent',
    promptTemplate: (idea, userMessage) => `You are a world-renowned scientist and technical advisor with deep expertise across technology domains. Your background:
- PhD-level research methodology
- Technical feasibility assessment
- Patent and prior art analysis
- Scientific validation approaches

COMMUNICATION STYLE:
- Be rigorous but accessible — explain complex concepts simply
- Distinguish between proven vs. theoretical approaches
- Suggest concrete experiments and validation steps
- Identify both technical strengths and unknowns

FOUNDER'S IDEA:
Title: ${sanitizeInput(idea.title, 200)}
One-liner: ${sanitizeInput(idea.oneLineSummary, 300)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target User: ${sanitizeInput(idea.targetUser, 300)}
Stage: ${sanitizeInput(idea.stage, 50)}

FOUNDER'S QUESTION:
${sanitizeInput(userMessage || 'Please evaluate the technical feasibility of my idea.', 2000)}

Provide scientific/technical analysis:`.trim(),
  },

  AGENT_MARKETING: {
    name: 'Marketer Agent',
    promptTemplate: (idea, userMessage) => `You are a legendary growth marketer who has launched dozens of successful products from zero to millions of users. Your expertise:
- Brand positioning and messaging
- Customer persona development
- Channel strategy and acquisition tactics
- Viral loops and referral mechanics
- Content marketing and storytelling

COMMUNICATION STYLE:
- Be creative and inspiring — help founders see possibilities
- Give specific, tactical advice they can implement today
- Use real examples from successful launches
- Focus on early traction (first 100-1000 customers)

FOUNDER'S IDEA:
Title: ${sanitizeInput(idea.title, 200)}
One-liner: ${sanitizeInput(idea.oneLineSummary, 300)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target User: ${sanitizeInput(idea.targetUser, 300)}
Stage: ${sanitizeInput(idea.stage, 50)}

FOUNDER'S QUESTION:
${sanitizeInput(userMessage || 'How should I market this and find my first customers?', 2000)}

Provide marketing and go-to-market advice:`.trim(),
  },

  AGENT_DEVELOPER: {
    name: 'Software Developer Agent',
    promptTemplate: (idea, userMessage) => `You are a senior software architect who has built products used by millions. Your expertise:
- Full-stack development and system design
- MVP scoping and feature prioritization
- Tech stack selection and trade-offs
- Development timeline estimation
- Technical hiring and team building

COMMUNICATION STYLE:
- Be practical and realistic — don't oversimplify timelines
- Recommend specific technologies with clear reasoning
- Warn about common technical pitfalls
- Help non-technical founders understand what's needed
- Balance "do it right" with "ship fast"

FOUNDER'S IDEA:
Title: ${sanitizeInput(idea.title, 200)}
One-liner: ${sanitizeInput(idea.oneLineSummary, 300)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target User: ${sanitizeInput(idea.targetUser, 300)}
Stage: ${sanitizeInput(idea.stage, 50)}
Roadmap: ${sanitizeInput(idea.roadmap, 500)}

FOUNDER'S QUESTION:
${sanitizeInput(userMessage || 'What tech stack should I use and how should I build this?', 2000)}

Provide technical development advice:`.trim(),
  },

  // ═══════════════════════════════════════════════════════════
  // PITCH DECK GENERATION — Red Bull Basement style
  // ═══════════════════════════════════════════════════════════

  PITCH_DECK_GENERATE: {
    name: 'Pitch Deck Generator',
    promptTemplate: (idea) => `You are an expert pitch deck consultant. Generate a compelling one-page pitch in the Red Bull Basement competition style.

Based on this idea, create a structured pitch with these exact sections:

IDEA CONTEXT:
Title: ${sanitizeInput(idea.title, 200)}
Summary: ${sanitizeInput(idea.oneLineSummary, 300)}
Problem: ${sanitizeInput(idea.problem, 1000)}
Solution: ${sanitizeInput(idea.solution, 1000)}
Target User: ${sanitizeInput(idea.targetUser, 300)}
Category: ${sanitizeInput(idea.category, 100)}

Generate these sections:

1. THE IDEA (max 10 words)
   - A punchy, memorable one-liner that captures the essence
   - Example: "Ordering shooting stars from your phone"

2. THE TARGET (1-2 sentences)
   - Who benefits and what's the market opportunity
   - Be specific about the audience segment

3. WHAT IT SOLVES (1-2 sentences)
   - The core problem being addressed
   - Make it emotionally resonant and urgent

4. HOW IT WORKS (2-4 sentences)
   - Clear explanation of the solution
   - Include key features or technology

FORMAT YOUR RESPONSE AS VALID JSON:
{
  "title": "Project Name",
  "theIdea": "One-liner (max 10 words)",
  "theTarget": "Target audience and market",
  "whatItSolves": "Core problem being solved",
  "howItWorks": "How the solution works"
}

Be concise, compelling, and specific. Avoid jargon. Make it memorable.`.trim(),
  },
};

const PROVIDERS: Record<TokenType, { name: string; envKey: string; model: string }> = {
  GEMINI: { name: 'Google Gemini', envKey: 'GEMINI_API_KEY', model: 'gemini-pro' },
  ANTHROPIC: { name: 'Anthropic Claude', envKey: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-4-20250514' },
  PERPLEXITY: { name: 'Perplexity AI', envKey: 'PERPLEXITY_API_KEY', model: 'sonar-medium-online' },
  CHATGPT: { name: 'OpenAI ChatGPT', envKey: 'OPENAI_API_KEY', model: 'gpt-4' },
  MISTRAL: { name: 'Mistral AI', envKey: 'MISTRAL_API_KEY', model: 'mistral-large-latest' },
  DEEPSEEK: { name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', model: 'deepseek-chat' },
  GROK: { name: 'xAI Grok', envKey: 'GROK_API_KEY', model: 'grok-2' },
  LLAMA: { name: 'Meta Llama', envKey: 'LLAMA_API_KEY', model: 'llama-3-70b' },
};

export async function runAiTool(service: string, idea: any, tokenType: TokenType = 'CHATGPT', userMessage?: string): Promise<AIServiceResult> {
  const config = AI_SERVICES[service];
  if (!config) throw new Error(`Unknown AI service: ${service}`);

  const provider = PROVIDERS[tokenType];
  const apiKey = process.env[provider.envKey];
  const prompt = config.promptTemplate(idea, userMessage);

  try {
    if (apiKey) {
      const text = await callProvider(tokenType, apiKey, prompt, provider.model);
      return { text, tokensUsed: estimateCreditCost(service, tokenType), provider: provider.name };
    }

    // No API key configured — return placeholder
    console.warn(`[AI] No ${provider.envKey} configured, using placeholder for ${service}`);
    return {
      text: getPlaceholderResponse(service, idea, tokenType, userMessage),
      tokensUsed: 0,
      provider: `${provider.name} (placeholder)`,
    };
  } catch (error: any) {
    console.error(`[AI] Error running ${service} via ${provider.name}:`, error?.message);
    return {
      text: getPlaceholderResponse(service, idea, tokenType, userMessage),
      tokensUsed: 0,
      provider: `${provider.name} (fallback)`,
    };
  }
}

// ─── Provider HTTP calls ─────────────────────────────────

async function callProvider(tokenType: TokenType, apiKey: string, prompt: string, model: string): Promise<string> {
  switch (tokenType) {
    case 'GEMINI':
      return callGemini(apiKey, prompt, model);
    case 'ANTHROPIC':
      return callAnthropic(apiKey, prompt, model);
    case 'PERPLEXITY':
      return callPerplexity(apiKey, prompt, model);
    case 'CHATGPT':
      return callOpenAI(apiKey, prompt, model);
    case 'MISTRAL':
      return callMistral(apiKey, prompt, model);
    case 'DEEPSEEK':
      return callDeepSeek(apiKey, prompt, model);
    case 'GROK':
      return callGrok(apiKey, prompt, model);
    case 'LLAMA':
      return callLlama(apiKey, prompt, model);
    default:
      throw new Error(`Unsupported provider: ${tokenType}`);
  }
}

async function callGemini(apiKey: string, prompt: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
  }, { timeout: 30000 });
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAnthropic(apiKey: string, prompt: string, model: string): Promise<string> {
  const res = await axios.post('https://api.anthropic.com/v1/messages', {
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.content?.[0]?.text || '';
}

async function callPerplexity(apiKey: string, prompt: string, model: string): Promise<string> {
  const res = await axios.post('https://api.perplexity.ai/chat/completions', {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.choices?.[0]?.message?.content || '';
}

async function callOpenAI(apiKey: string, prompt: string, model: string): Promise<string> {
  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.choices?.[0]?.message?.content || '';
}

async function callMistral(apiKey: string, prompt: string, model: string): Promise<string> {
  const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.choices?.[0]?.message?.content || '';
}

async function callDeepSeek(apiKey: string, prompt: string, model: string): Promise<string> {
  const res = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.choices?.[0]?.message?.content || '';
}

async function callGrok(apiKey: string, prompt: string, model: string): Promise<string> {
  const res = await axios.post('https://api.x.ai/v1/chat/completions', {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.choices?.[0]?.message?.content || '';
}

async function callLlama(apiKey: string, prompt: string, model: string): Promise<string> {
  // Uses Together.ai or similar Llama hosting endpoint
  const res = await axios.post('https://api.together.xyz/v1/chat/completions', {
    model: 'meta-llama/Llama-3-70b-chat-hf',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.choices?.[0]?.message?.content || '';
}

function getPlaceholderResponse(service: string, idea: any, tokenType: TokenType, userMessage?: string): string {
  switch (service) {
    case 'LLM_SUMMARY_IMPROVE':
      return `${idea.title} - ${(idea.solution || '').substring(0, 80)} for ${idea.targetUser}.`;
    case 'LLM_PITCH_DRAFT':
      return `# ${idea.title} - 6-Slide Pitch Deck\n\n**Slide 1: The Problem**\n• ${(idea.problem || '').split('.')[0]}.\n\n**Slide 2: Our Solution**\n• ${(idea.solution || '').split('.')[0]}.\n\n**Slide 3: Market**\n• Target: ${idea.targetUser}\n\n**Slide 4: Competitive Edge**\n• ${(idea.differentiation || '').split('.')[0]}.\n\n**Slide 5: Business Model**\n• ${(idea.monetization || '').split('.')[0]}.\n\n**Slide 6: Roadmap**\n• Stage: ${idea.stage}`;
    case 'LLM_ROADMAP_GENERATE':
      return `# 6-Month Roadmap for ${idea.title}\n\n**Month 1:** Foundation & requirements\n**Month 2:** MVP development\n**Month 3:** Beta testing with ${idea.targetUser}\n**Month 4:** Launch preparation\n**Month 5:** Public launch\n**Month 6:** Growth & iteration`;
    case 'AGENT_BUSINESS':
      return `**Business Analysis for ${idea.title}**\n\nYou asked: "${userMessage || 'Tell me about the market opportunity'}"\n\n**Market Opportunity:** Your target market of ${idea.targetUser} represents a significant opportunity. Based on your solution "${(idea.solution || '').substring(0, 50)}...", I recommend focusing on:\n\n1. **Revenue Model:** Consider ${idea.monetization || 'subscription-based pricing'} to maximize recurring revenue\n2. **Market Size:** Estimate your TAM, SAM, and SOM for ${idea.targetUser}\n3. **Go-to-Market:** Start with early adopters who experience the problem most acutely\n\n*Would you like me to dive deeper into any of these areas?*`;
    case 'AGENT_SCIENCE':
      return `**Technical Analysis for ${idea.title}**\n\nYou asked: "${userMessage || 'Analyze the technical approach'}"\n\n**Technical Assessment:**\n\n1. **Feasibility:** The solution "${(idea.solution || '').substring(0, 50)}..." is technically achievable with current technology\n2. **Architecture:** Recommend a microservices approach for scalability\n3. **Key Challenges:**\n   - Data handling and privacy compliance\n   - Performance optimization for ${idea.targetUser}\n   - Integration with existing systems\n\n**Research Recommendations:** Explore recent papers on similar implementations.\n\n*What technical aspects would you like me to elaborate on?*`;
    case 'AGENT_MARKETING':
      return `**Marketing Strategy for ${idea.title}**\n\nYou asked: "${userMessage || 'How should we market this?'}"\n\n**Brand & Messaging:**\n\n🎯 **Target Audience:** ${idea.targetUser}\n\n📢 **Key Value Proposition:** "${(idea.solution || '').substring(0, 60)}..."\n\n**Channel Strategy:**\n1. **Content Marketing:** Educational content addressing "${(idea.problem || '').substring(0, 40)}..."\n2. **Social Media:** Focus on platforms where ${idea.targetUser} are most active\n3. **Partnerships:** Collaborate with influencers in your space\n\n**Messaging Tips:** Lead with the problem, then present your unique solution.\n\n*Want me to develop specific campaign ideas?*`;
    case 'AGENT_DEVELOPER':
      return `**Development Roadmap for ${idea.title}**\n\nYou asked: "${userMessage || 'How should we build this?'}"\n\n**Technical Stack Recommendation:**\n\n⚙️ **Architecture:**\n- Frontend: React Native for cross-platform mobile\n- Backend: Node.js with TypeScript\n- Database: PostgreSQL for relational data\n\n**MVP Features (Phase 1):**\n1. Core functionality for ${idea.targetUser}\n2. User authentication and onboarding\n3. Basic analytics dashboard\n\n**Timeline:** 8-12 weeks for MVP\n\n**Code Quality:** Implement CI/CD from day one, write tests for critical paths.\n\n*Would you like detailed technical specifications for any component?*`;
    case 'PITCH_DECK_GENERATE':
      return JSON.stringify({
        title: idea.title,
        theIdea: (idea.solution || 'An innovative solution to transform the industry'),
        theTarget: (idea.targetUser || 'Forward-thinking individuals and businesses'),
        whatItSolves: (idea.problem || 'A critical challenge that has been overlooked'),
        howItWorks: `Our approach uses ${(idea.differentiation || 'cutting-edge technology')} to deliver results. ${(idea.monetization || 'We monetize through value-based pricing')}.`
      });
    default:
      return `[${PROVIDERS[tokenType].name}] AI response for ${service} processed.`;
  }
}

export function estimateCreditCost(service: string, tokenType: TokenType = 'CHATGPT'): number {
  const multipliers: Record<TokenType, number> = {
    GEMINI: 0.8, ANTHROPIC: 1.2, PERPLEXITY: 1.0, CHATGPT: 1.0,
    MISTRAL: 0.9, DEEPSEEK: 0.5, GROK: 1.1, LLAMA: 0.3,
  };
  const baseCosts: Record<string, number> = { LLM_SUMMARY_IMPROVE: 10, LLM_PITCH_DRAFT: 20, LLM_ROADMAP_GENERATE: 20 };
  return Math.ceil((baseCosts[service] || 15) * multipliers[tokenType]);
}
