import { storageService } from './storage';

export type AIModel = 'gemini' | 'deepseek' | 'openai' | 'openrouter';

export interface GeminiModelOption {
  id: string;
  name: string;
  description: string;
}

export interface AIModelConfig {
  id: AIModel;
  name: string;
  apiKeyName: string;
  models: string[];
  isFree?: boolean;
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Best for prototyping — fast, capable & free tier friendly' },
  { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight and fastest' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smallest 1.5 model' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Complex reasoning model' }
];

export const AI_MODELS: Record<AIModel, AIModelConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    apiKeyName: 'gemini',
    models: GEMINI_MODELS.map(m => m.id)
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    apiKeyName: 'deepseek',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    apiKeyName: 'openai',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Free Models)',
    apiKeyName: 'openrouter',
    models: ['openchat/openchat-7b:free', 'nousresearch/nous-hermes-2-mistral-7b-dpo:free', 'undi95/toppy-m-7b:free'],
    isFree: true
  }
};

export const getApiKey = (provider: AIModel): string | null => {
  const config = AI_MODELS[provider];
  if (!config) return null;

  if (provider === 'gemini') {
    return 'backend-managed-key';
  }

  const envKey = import.meta.env[`VITE_${config.apiKeyName.toUpperCase()}_API_KEY`];
  return envKey || null;
};

export const getSelectedModel = (): AIModel => {
  try {
    const saved = localStorage.getItem('selected_ai_model');
    if (saved && (saved === 'gemini' || saved === 'deepseek' || saved === 'openai' || saved === 'openrouter')) {
      return saved as AIModel;
    }
  } catch (error) {
    console.error('Error loading selected model:', error);
  }
  return 'gemini';
};

export const saveSelectedModel = (model: AIModel): void => {
  try {
    localStorage.setItem('selected_ai_model', model);
  } catch (error) {
    console.error('Error saving selected model:', error);
  }
};

export const getSelectedGeminiModel = (): string => {
  try {
    const saved = localStorage.getItem('selected_gemini_model');
    if (saved && GEMINI_MODELS.some(m => m.id === saved)) {
      return saved;
    }
  } catch (error) {
    console.error('Error loading selected Gemini model:', error);
  }
  return GEMINI_MODELS[0].id;
};

export const saveSelectedGeminiModel = (modelId: string): void => {
  try {
    localStorage.setItem('selected_gemini_model', modelId);
  } catch (error) {
    console.error('Error saving selected Gemini model:', error);
  }
};

export const testGeminiModel = async (apiKey: string, modelId: string): Promise<boolean> => {
  console.log(`Skipping direct test for model ${modelId} to maintain backend-only architecture.`);
  return true;
};

export const detectAvailableGeminiModels = async (
  apiKey: string,
  onProgress?: (modelId: string, available: boolean, index: number, total: number) => void
): Promise<string[]> => {
  const availableModels: string[] = [];
  const total = GEMINI_MODELS.length;

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const isAvailable = await testGeminiModel(apiKey, model.id);

    if (isAvailable) {
      availableModels.push(model.id);
    }

    if (onProgress) {
      onProgress(model.id, isAvailable, i + 1, total);
    }
  }

  return availableModels;
};

export const autoSelectGeminiModel = async (
  apiKey: string,
  onProgress?: (modelId: string, available: boolean, index: number, total: number) => void
): Promise<string | null> => {
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const isAvailable = await testGeminiModel(apiKey, model.id);

    if (onProgress) {
      onProgress(model.id, isAvailable, i + 1, GEMINI_MODELS.length);
    }

    if (isAvailable) {
      saveSelectedGeminiModel(model.id);
      return model.id;
    }
  }

  return null;
};

export const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });

    if (response.status === 429) {
      throw new Error(`Experiencing high traffic. Please wait about 60 seconds and try again.`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data.reply) return data.reply;

    throw new Error('Invalid response from server');
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Cannot reach AI backend. If running locally, please use `npm run dev:full`.');
    }
    throw new Error(error.message || 'Unknown error communicating with the server');
  }
};

export const callDeepSeekAPI = async (prompt: string, apiKey: string, model?: string): Promise<string> => {
  const modelToUse = model || AI_MODELS.deepseek.models[0];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: 'You are an experienced medical professional certified in emergency medicine and first aid.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;

  throw new Error('Invalid response from DeepSeek API');
};

export const callOpenAIAPI = async (prompt: string, apiKey: string, model?: string): Promise<string> => {
  const modelToUse = model || AI_MODELS.openai.models[0];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: 'You are an experienced medical professional certified in emergency medicine and first aid.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;

  throw new Error('Invalid response from OpenAI API');
};

const callOpenRouterAPI = async (prompt: string, apiKey: string, model?: string): Promise<string> => {
  const modelsToTry = model ? [model] : AI_MODELS.openrouter.models;
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Medical Assistant'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'You are a helpful medical assistant. Provide clear, accurate health information and suggest when to see a doctor. Always include a disclaimer that you are not a substitute for professional medical advice.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
        lastError = new Error(error.error?.message || `OpenRouter API error (${response.status})`);
        continue;
      }

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }

      lastError = new Error('Invalid response format from OpenRouter API');
      continue;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  if (lastError) throw lastError;
  throw new Error('No OpenRouter models available. Please check your API key or try again later.');
};

export const callAIAPI = async (prompt: string, model?: AIModel): Promise<string> => {
  const selectedModel = model || getSelectedModel();
  const apiKey = getApiKey(selectedModel);

  if (!apiKey) {
    throw new Error(`Please configure your ${AI_MODELS[selectedModel].name} API key in Account Settings.`);
  }

  try {
    switch (selectedModel) {
      case 'gemini':
        return await callGeminiAPI(prompt);
      case 'deepseek':
        return await callDeepSeekAPI(prompt, apiKey);
      case 'openai':
        return await callOpenAIAPI(prompt, apiKey);
      case 'openrouter':
        return await callOpenRouterAPI(prompt, apiKey);
      default:
        throw new Error(`Unsupported AI model: ${selectedModel}`);
    }
  } catch (error) {
    if (selectedModel === 'openrouter') {
      try {
        const geminiKey = getApiKey('gemini');
        if (geminiKey) return await callGeminiAPI(prompt);
      } catch (fallbackError) {
        console.error('Fallback to Gemini also failed:', fallbackError);
      }
    }
    throw error;
  }
};
