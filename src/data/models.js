/**
 * AI Model Configurations
 * Comprehensive list of models from Gemini, OpenAI, Anthropic Claude, and xAI Grok
 * Updated: January 2026 - V36 with corrected API model identifiers
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
  // Ref: https://ai.google.dev/gemini-api/docs/models
  gemini: [
    {
      id: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro',
      description: 'Latest flagship - Best for complex reasoning & agentic workflows',
      tier: 'flagship',
      contextWindow: '1M tokens',
      provider: 'gemini',
      isNew: true
    },
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash',
      description: 'Latest fast model - Best for multimodal understanding',
      tier: 'standard',
      contextWindow: '1M tokens',
      provider: 'gemini',
      isNew: true
    },
    {
      id: 'gemini-3-deep-think-preview',
      name: 'Gemini 3 Deep Think',
      description: 'Advanced reasoning with adaptive thinking',
      tier: 'flagship',
      contextWindow: '1M tokens',
      provider: 'gemini',
      isNew: true
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: 'Best for complex reasoning & coding',
      tier: 'flagship',
      contextWindow: '1M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Lightning-fast with controllable thinking',
      tier: 'standard',
      contextWindow: '1M tokens',
      provider: 'gemini'
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      description: 'Cost-optimized for high-throughput tasks',
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
      description: 'Cost-optimized for large scale text output',
      tier: 'lite',
      contextWindow: '1M tokens',
      provider: 'gemini'
    }
  ],

  // ========== OPENAI MODELS ==========
  // Ref: https://platform.openai.com/docs/models & https://platform.openai.com/docs/pricing
  openai: [
    // GPT-4.1 Family - Smartest non-reasoning models (April 2025)
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      description: 'Smartest non-reasoning model - Excels at coding & instruction following',
      tier: 'flagship',
      contextWindow: '1M tokens',
      provider: 'openai',
      isNew: true
    },
    {
      id: 'gpt-4.1-mini',
      name: 'GPT-4.1 Mini',
      description: 'Beats GPT-4o at 83% lower cost - Great for text & vision',
      tier: 'standard',
      contextWindow: '1M tokens',
      provider: 'openai',
      isNew: true
    },
    {
      id: 'gpt-4.1-nano',
      name: 'GPT-4.1 Nano',
      description: 'Fastest & cheapest - Best for classification & autocomplete',
      tier: 'lite',
      contextWindow: '1M tokens',
      provider: 'openai',
      isNew: true
    },
    // O-series Reasoning Models
    {
      id: 'o3',
      name: 'o3',
      description: 'Powerful reasoning - Coding, math, science & visual perception',
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
      description: 'Fast, cost-efficient reasoning model',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'openai',
      isNew: true
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      description: 'Small reasoning alternative to o3 - 100K max output',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'openai'
    },
    {
      id: 'o1',
      name: 'o1',
      description: 'Previous full o-series reasoning model',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'openai'
    },
    // GPT-4o Family - Legacy but still available
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Multimodal flagship - Text & image (legacy)',
      tier: 'standard',
      contextWindow: '128K tokens',
      provider: 'openai',
      isLegacy: true
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Fast & affordable multimodal (legacy)',
      tier: 'lite',
      contextWindow: '128K tokens',
      provider: 'openai',
      isLegacy: true
    }
  ],

  // ========== ANTHROPIC CLAUDE MODELS ==========
  // Ref: https://docs.anthropic.com/en/docs/about-claude/models/overview
  anthropic: [
    {
      id: 'claude-opus-4-5-20251124',
      name: 'Claude Opus 4.5',
      description: 'Latest flagship - Industry leader for coding & agents',
      tier: 'flagship',
      contextWindow: '200K tokens',
      outputLimit: '64K tokens',
      provider: 'anthropic',
      isNew: true
    },
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      description: 'Best coding model - 1M context available',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'anthropic',
      isNew: true
    },
    {
      id: 'claude-opus-4-1-20250805',
      name: 'Claude Opus 4.1',
      description: 'Best for agentic search & coding',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-opus-4-20250522',
      name: 'Claude Opus 4',
      description: 'Best for complex, nuanced analysis',
      tier: 'flagship',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-sonnet-4-20250522',
      name: 'Claude Sonnet 4',
      description: 'Best for coding & technical tasks',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    },
    {
      id: 'claude-haiku-4-5-20251022',
      name: 'Claude Haiku 4.5',
      description: 'Near-frontier coding, matches Sonnet 4',
      tier: 'lite',
      contextWindow: '200K tokens',
      provider: 'anthropic',
      isNew: true
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Writing & creativity (retiring soon)',
      tier: 'standard',
      contextWindow: '200K tokens',
      provider: 'anthropic',
      isLegacy: true
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Speed & efficiency',
      tier: 'lite',
      contextWindow: '200K tokens',
      provider: 'anthropic'
    }
  ],

  // ========== XAI GROK MODELS ==========
  // Ref: https://docs.x.ai/docs/models
  xai: [
    {
      id: 'grok-4-1-fast-reasoning',
      name: 'Grok 4.1 Fast (Reasoning)',
      description: 'Frontier model optimized for agentic tool calling',
      tier: 'flagship',
      contextWindow: '2M tokens',
      provider: 'xai',
      isNew: true
    },
    {
      id: 'grok-4-1-fast-non-reasoning',
      name: 'Grok 4.1 Fast (Instant)',
      description: 'Fast variant for instant responses without reasoning',
      tier: 'flagship',
      contextWindow: '2M tokens',
      provider: 'xai',
      isNew: true
    },
    {
      id: 'grok-code-fast-1',
      name: 'Grok Code Fast',
      description: 'Speedy & economical for agentic coding',
      tier: 'standard',
      contextWindow: '256K tokens',
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
      id: 'grok-3',
      name: 'Grok 3',
      description: 'Flagship reasoning model (Feb 2025)',
      tier: 'standard',
      contextWindow: '128K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-2-1212',
      name: 'Grok 2',
      description: 'Better accuracy & multilingual capabilities',
      tier: 'standard',
      contextWindow: '32K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-2-vision-1212',
      name: 'Grok 2 Vision',
      description: 'Image understanding & analysis',
      tier: 'standard',
      contextWindow: '32K tokens',
      provider: 'xai'
    },
    {
      id: 'grok-2-image-1212',
      name: 'Grok 2 Image',
      description: 'Text-to-image generation',
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

/**
 * Get non-legacy models only
 */
export const getActiveModels = () => {
  return getAllModels().filter(m => !m.isLegacy);
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
  getModelsByTier,
  getActiveModels
};
