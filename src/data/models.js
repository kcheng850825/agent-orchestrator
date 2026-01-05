/**
 * AI Model Configurations
 * Comprehensive list of models from Gemini, OpenAI, Anthropic Claude, and xAI Grok
 * Updated: January 2026
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
  },
  xai: {
    name: 'xAI Grok',
    icon: '⚡',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    keyName: 'xai'
  }
};

export const MODELS = {
  // ========== GOOGLE GEMINI MODELS ==========
  gemini: [
    {
      id: 'gemini-3-pro',
      name: 'Gemini 3 Pro',
      description: 'Latest flagship - Best for complex reasoning & analysis',
      tier: 'flagship',
      contextWindow: '1M tokens',
      provider: 'gemini',
      isNew: true
    },
    {
      id: 'gemini-3-flash',
      name: 'Gemini 3 Flash',
      description: 'Latest fast model - Best for everyday tasks',
      tier: 'standard',
      contextWindow: '1M tokens',
      provider: 'gemini',
      isNew: true
    },
    {
      id: 'gemini-3-deep-think',
      name: 'Gemini 3 Deep Think',
      description: 'Advanced reasoning with parallel thought streams',
      tier: 'flagship',
      contextWindow: '1M tokens',
      provider: 'gemini',
      isNew: true
    },
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
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Best for long-context understanding',
      tier: 'standard',
      contextWindow: '2M tokens',
      provider: 'gemini'
    }
  ],

  // ========== OPENAI MODELS ==========
  openai: [
    {
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      description: 'Latest flagship - Best for professional & agentic work',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'openai',
      isNew: true
    },
    {
      id: 'gpt-5.2-pro',
      name: 'GPT-5.2 Pro',
      description: 'First model to cross 90% on ARC-AGI-1',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'openai',
      isNew: true
    },
    {
      id: 'gpt-5.1',
      name: 'GPT-5.1',
      description: 'Warmer, more intelligent, better at instructions',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'openai',
      isNew: true
    },
    {
      id: 'gpt-5.1-thinking',
      name: 'GPT-5.1 Thinking',
      description: 'Advanced reasoning model with extended thinking',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'openai',
      isNew: true
    },
    {
      id: 'gpt-5',
      name: 'GPT-5',
      description: 'Major leap in intelligence - 45% less hallucination',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'openai'
    },
    {
      id: 'o3',
      name: 'o3',
      description: 'Best for PhD-level scientific reasoning',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'openai'
    },
    {
      id: 'o3-pro',
      name: 'o3 Pro',
      description: 'Extended thinking for most reliable responses',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'openai'
    },
    {
      id: 'o4-mini',
      name: 'o4-mini',
      description: 'Fast, cost-efficient reasoning - Best on AIME',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'openai',
      isNew: true
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
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Best for multimodal understanding',
      tier: 'standard',
      contextWindow: '128K tokens',
      provider: 'openai'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Best for fast, affordable intelligence',
      tier: 'lite',
      contextWindow: '128K tokens',
      provider: 'openai'
    }
  ],

  // ========== ANTHROPIC CLAUDE MODELS ==========
  anthropic: [
    {
      id: 'claude-opus-4-5-20251101',
      name: 'Claude Opus 4.5',
      description: 'Latest flagship - Best in world for coding & agents',
      tier: 'flagship',
      contextWindow: '200K tokens',
      outputLimit: '64K tokens',
      provider: 'anthropic',
      isNew: true
    },
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
  ],

  // ========== XAI GROK MODELS ==========
  xai: [
    {
      id: 'grok-4.1',
      name: 'Grok 4.1',
      description: 'Latest flagship - #1 on LMArena (1483 Elo)',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'xai',
      isNew: true
    },
    {
      id: 'grok-4.1-fast',
      name: 'Grok 4.1 Fast',
      description: '40% fewer thinking tokens, 2M context window',
      tier: 'flagship',
      contextWindow: '2M tokens',
      provider: 'xai',
      isNew: true
    },
    {
      id: 'grok-4',
      name: 'Grok 4',
      description: 'Native tool use & real-time search integration',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-4-heavy',
      name: 'Grok 4 Heavy',
      description: 'Maximum capability for complex tasks',
      tier: 'flagship',
      contextWindow: '256K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-3',
      name: 'Grok 3',
      description: 'Best for general-purpose reasoning',
      tier: 'standard',
      contextWindow: '128K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-3-mini',
      name: 'Grok 3 Mini',
      description: 'Fast & efficient for everyday tasks',
      tier: 'lite',
      contextWindow: '128K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-2-vision-1212',
      name: 'Grok 2 Vision',
      description: 'Best for image understanding & analysis',
      tier: 'standard',
      contextWindow: '32K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-2-image-1212',
      name: 'Grok 2 Image',
      description: 'Image generation capabilities',
      tier: 'standard',
      contextWindow: '32K tokens',
      provider: 'xai'
    }
  ]
};

/**
 * Get all models as a flat array
 */
export const getAllModels = () => {
  return [...MODELS.gemini, ...MODELS.openai, ...MODELS.anthropic, ...MODELS.xai];
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

/**
 * Get new/latest models only
 */
export const getNewModels = () => {
  return getAllModels().filter(m => m.isNew);
};

/**
 * Get models by tier
 */
export const getModelsByTier = (tier) => {
  return getAllModels().filter(m => m.tier === tier);
};

export default {
  MODEL_PROVIDERS,
  MODELS,
  getAllModels,
  getModelById,
  getModelsByProvider,
  getProviderForModel,
  hasApiKeyForModel,
  getNewModels,
  getModelsByTier
};
