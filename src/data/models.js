/**
 * AI Model Configurations
 * Comprehensive list of models from Gemini, OpenAI, and Anthropic Claude
 */

export const MODEL_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    icon: '🔷',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    keyName: 'gemini'
  },
  openai: {
    name: 'OpenAI',
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    keyName: 'openai'
  },
  anthropic: {
    name: 'Anthropic Claude',
    icon: '🟠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    keyName: 'anthropic'
  }
};

export const MODELS = {
  // ========== GOOGLE GEMINI MODELS ==========
  gemini: [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: 'Best for complex reasoning & analysis',
      tier: 'flagship',
      contextWindow: '1M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Best for fast, everyday tasks',
      tier: 'standard',
      contextWindow: '1M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      description: 'Best for high-volume, cost-efficient tasks',
      tier: 'lite',
      contextWindow: '1M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Best for balanced speed & quality',
      tier: 'standard',
      contextWindow: '1M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-2.0-flash-lite',
      name: 'Gemini 2.0 Flash Lite',
      description: 'Best for simple, quick responses',
      tier: 'lite',
      contextWindow: '1M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Best for long-context understanding',
      tier: 'standard',
      contextWindow: '2M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Best for quick multimodal tasks',
      tier: 'lite',
      contextWindow: '1M tokens',
      provider: 'gemini'
    }
  ],

  // ========== OPENAI MODELS ==========
  openai: [
    {
      id: 'o3',
      name: 'o3',
      description: 'Best for PhD-level scientific reasoning',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'openai'
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      description: 'Best for fast advanced reasoning',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'openai'
    },
    {
      id: 'o1',
      name: 'o1',
      description: 'Best for complex math & coding',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'openai'
    },
    {
      id: 'o1-mini',
      name: 'o1-mini',
      description: 'Best for efficient reasoning tasks',
      tier: 'standard',
      contextWindow: '128K tokens',
      provider: 'openai'
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Best for multimodal understanding',
      tier: 'flagship',
      contextWindow: '128K tokens',
      provider: 'openai'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Best for fast, affordable intelligence',
      tier: 'standard',
      contextWindow: '128K tokens',
      provider: 'openai'
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Best for large document processing',
      tier: 'standard',
      contextWindow: '128K tokens',
      provider: 'openai'
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Best for reliable, proven performance',
      tier: 'standard',
      contextWindow: '8K tokens',
      provider: 'openai'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Best for cost-effective simple tasks',
      tier: 'lite',
      contextWindow: '16K tokens',
      provider: 'openai'
    }
  ],

  // ========== ANTHROPIC CLAUDE MODELS ==========
  anthropic: [
    {
      id: 'claude-opus-4-20250514',
      name: 'Claude Opus 4',
      description: 'Best for complex, nuanced analysis',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      description: 'Best for coding & technical tasks',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet',
      description: 'Best for balanced performance',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Best for writing & creativity',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Best for speed & efficiency',
      tier: 'lite',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Best for research & deep analysis',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      description: 'Best for everyday assistance',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      description: 'Best for quick, simple responses',
      tier: 'lite',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    }
  ]
};

/**
 * Get all models as a flat array
 */
export const getAllModels = () => {
  return [...MODELS.gemini, ...MODELS.openai, ...MODELS.anthropic];
};

/**
 * Get model by ID
 */
export const getModelById = (modelId) => {
  return getAllModels().find(m => m.id === modelId);
};

/**
 * Get models grouped by provider
 */
export const getModelsByProvider = () => {
  return MODELS;
};

/**
 * Get provider info for a model
 */
export const getProviderForModel = (modelId) => {
  const model = getModelById(modelId);
  if (!model) return null;
  return MODEL_PROVIDERS[model.provider];
};

/**
 * Check if API key is available for a model
 */
export const hasApiKeyForModel = (modelId, apiKeys) => {
  const model = getModelById(modelId);
  if (!model) return false;
  const provider = MODEL_PROVIDERS[model.provider];
  return !!apiKeys[provider.keyName];
};

export default {
  MODEL_PROVIDERS,
  MODELS,
  getAllModels,
  getModelById,
  getModelsByProvider,
  getProviderForModel,
  hasApiKeyForModel
};
