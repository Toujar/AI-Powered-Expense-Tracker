export type AIProvider = 'openrouter' | 'groq' | 'cursor' | 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const STORAGE_KEYS = {
  PROVIDER: 'expense_tracker_ai_provider',
  API_KEY: 'expense_tracker_ai_api_key',
  MODEL: 'expense_tracker_ai_model',
};

function getEnvProvider(): AIProvider | undefined {
  const p = import.meta.env?.VITE_AI_PROVIDER as string | undefined;
  if (!p) return undefined;
  if (p === 'groq') return 'groq';
  if (p === 'cursor') return 'cursor';
  if (p === 'openai') return 'openai';
  return 'openrouter';
}

function getEnvModel(): string | undefined {
  return import.meta.env?.VITE_AI_MODEL as string | undefined;
}

function getEnvApiKey(provider: AIProvider): string | undefined {
  if (provider === 'groq') {
    return import.meta.env?.VITE_GROQ_API_KEY as string | undefined;
  }
  if (provider === 'cursor') {
    return import.meta.env?.VITE_CURSOR_API_KEY as string | undefined;
  }
  if (provider === 'openai') {
    return import.meta.env?.VITE_OPENAI_API_KEY as string | undefined;
  }
  return import.meta.env?.VITE_OPENROUTER_API_KEY as string | undefined;
}

function getCursorBaseUrl(): string | undefined {
  return import.meta.env?.VITE_CURSOR_BASE_URL as string | undefined;
}

export function getAISettings() {
  const storedProvider = (localStorage.getItem(STORAGE_KEYS.PROVIDER) as AIProvider) || 'openrouter';
  const envProvider = getEnvProvider();
  const provider = envProvider || storedProvider;

  const storedModel = localStorage.getItem(STORAGE_KEYS.MODEL) || defaultModelFor(provider);
  const envModel = getEnvModel();
  const model = envModel || storedModel;

  const storedKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  const envKey = getEnvApiKey(provider) || '';
  const apiKey = envKey || storedKey;

  return { provider, apiKey, model } as { provider: AIProvider; apiKey: string; model: string };
}

export function saveAISettings(settings: { provider: AIProvider; apiKey: string; model?: string }) {
  localStorage.setItem(STORAGE_KEYS.PROVIDER, settings.provider);
  localStorage.setItem(STORAGE_KEYS.API_KEY, settings.apiKey);
  if (settings.model) localStorage.setItem(STORAGE_KEYS.MODEL, settings.model);
}

function defaultModelFor(provider: AIProvider): string {
  switch (provider) {
    case 'groq':
      return 'llama3-70b-8192';
    case 'cursor':
      // Let users set VITE_AI_MODEL; provide a reasonable OpenAI-style default
      return 'gpt-4o-mini';
    case 'openai':
      return 'gpt-4o-mini';
    case 'openrouter':
    default:
      return 'meta-llama/llama-3.1-70b-instruct:free';
  }
}

function getEndpoint(provider: AIProvider) {
  if (provider === 'groq') {
    return 'https://api.groq.com/openai/v1/chat/completions';
  }
  if (provider === 'cursor') {
    // Allow custom base URL (OpenAI-compatible). Default to typical OpenAI path.
    const base = getCursorBaseUrl() || 'https://api.cursor.sh/v1';
    return `${base.replace(/\/$/, '')}/chat/completions`;
  }
  if (provider === 'openai') {
    return 'https://api.openai.com/v1/chat/completions';
  }
  return 'https://openrouter.ai/api/v1/chat/completions';
}

function headersFor(provider: AIProvider, apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  } as Record<string, string>;
}

export interface AdviceInputContext {
  monthlyBudget?: number;
  summary: {
    totalThisMonth: number;
    avgDaily: number;
    topCategories: Array<{ category: string; amount: number }>;
    limitsProgress: Array<{ category: string; spent: number; limit: number; percentage: number; remaining: number; isOverBudget: boolean }>;
  };
}

export async function generateAdvice(messages: ChatMessage[], context: AdviceInputContext): Promise<string> {
  const { provider, apiKey, model } = getAISettings();
  
  // Debug logging
  console.log('AI Settings Debug:', {
    provider,
    model,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    envVars: {
      VITE_AI_PROVIDER: import.meta.env?.VITE_AI_PROVIDER,
      VITE_AI_MODEL: import.meta.env?.VITE_AI_MODEL,
      VITE_OPENAI_API_KEY: import.meta.env?.VITE_OPENAI_API_KEY ? '***' : 'undefined',
    },
    allEnvVars: Object.keys(import.meta.env || {}),
    importMetaEnv: import.meta.env
  });
  
  if (!apiKey) {
    throw new Error('Missing AI API key. Set it in your .env (VITE_OPENAI_API_KEY, VITE_OPENROUTER_API_KEY, VITE_GROQ_API_KEY, or VITE_CURSOR_API_KEY).');
  }

  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `You are a friendly personal finance assistant. Give practical, short, and specific budgeting advice. Use the provided user context to ground suggestions. Avoid generic disclaimers.

User context:
- Monthly budget: ${context.monthlyBudget ?? 'unknown'}
- This month total: $${context.summary.totalThisMonth.toFixed(2)}
- Avg daily spend: $${context.summary.avgDaily.toFixed(2)}
- Top categories: ${context.summary.topCategories.map(c => `${c.category} $${c.amount.toFixed(2)}`).join(', ') || 'n/a'}
- Limits: ${context.summary.limitsProgress.map(l => `${l.category} ${l.percentage.toFixed(0)}% ($${l.spent.toFixed(2)}/$${l.limit.toFixed(2)})`).join('; ') || 'n/a'}`,
  };

  const body = {
    model,
    messages: [systemPrompt, ...messages],
    temperature: 0.3,
    max_tokens: 600,
  } as any;

  const response = await fetch(getEndpoint(provider), {
    method: 'POST',
    headers: headersFor(provider, apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  return content;
}
