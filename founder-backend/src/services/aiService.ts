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

const AI_SERVICES: Record<string, { name: string; promptTemplate: (idea: any) => string }> = {
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

export async function runAiTool(service: string, idea: any, tokenType: TokenType = 'CHATGPT'): Promise<AIServiceResult> {
  const config = AI_SERVICES[service];
  if (!config) throw new Error(`Unknown AI service: ${service}`);

  const provider = PROVIDERS[tokenType];
  const apiKey = process.env[provider.envKey];
  const prompt = config.promptTemplate(idea);

  try {
    if (apiKey) {
      const text = await callProvider(tokenType, apiKey, prompt, provider.model);
      return { text, tokensUsed: estimateCreditCost(service, tokenType), provider: provider.name };
    }

    // No API key configured — return placeholder
    console.warn(`[AI] No ${provider.envKey} configured, using placeholder for ${service}`);
    return {
      text: getPlaceholderResponse(service, idea, tokenType),
      tokensUsed: 0,
      provider: `${provider.name} (placeholder)`,
    };
  } catch (error: any) {
    console.error(`[AI] Error running ${service} via ${provider.name}:`, error?.message);
    return {
      text: getPlaceholderResponse(service, idea, tokenType),
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

function getPlaceholderResponse(service: string, idea: any, tokenType: TokenType): string {
  switch (service) {
    case 'LLM_SUMMARY_IMPROVE':
      return `${idea.title} - ${(idea.solution || '').substring(0, 80)} for ${idea.targetUser}.`;
    case 'LLM_PITCH_DRAFT':
      return `# ${idea.title} - 6-Slide Pitch Deck\n\n**Slide 1: The Problem**\n• ${(idea.problem || '').split('.')[0]}.\n\n**Slide 2: Our Solution**\n• ${(idea.solution || '').split('.')[0]}.\n\n**Slide 3: Market**\n• Target: ${idea.targetUser}\n\n**Slide 4: Competitive Edge**\n• ${(idea.differentiation || '').split('.')[0]}.\n\n**Slide 5: Business Model**\n• ${(idea.monetization || '').split('.')[0]}.\n\n**Slide 6: Roadmap**\n• Stage: ${idea.stage}`;
    case 'LLM_ROADMAP_GENERATE':
      return `# 6-Month Roadmap for ${idea.title}\n\n**Month 1:** Foundation & requirements\n**Month 2:** MVP development\n**Month 3:** Beta testing with ${idea.targetUser}\n**Month 4:** Launch preparation\n**Month 5:** Public launch\n**Month 6:** Growth & iteration`;
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
