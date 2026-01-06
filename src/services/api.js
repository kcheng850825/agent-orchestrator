/**
 * Multi-Provider AI API Service
 * Supports Google Gemini, OpenAI, Anthropic Claude, and xAI Grok
 * With streaming support for real-time responses
 * Updated: January 2026
 */

import { checkGuardrails } from './guardrails';

/**
 * Detect which provider a model belongs to
 */
export const getProviderFromModel = (model) => {
  if (model.startsWith('gemini-')) return 'gemini';
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('grok-')) return 'xai';
  return 'gemini'; // default
};

/**
 * Estimate token count (rough approximation: ~4 chars per token)
 */
export const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Get context window size for a model
 */
export const getContextWindowSize = (model) => {
  const contextWindows = {
    // Gemini
    'gemini-3-pro': 1000000,
    'gemini-3-flash': 1000000,
    'gemini-3-deep-think': 1000000,
    'gemini-2.5-pro': 1000000,
    'gemini-2.5-flash': 1000000,
    'gemini-2.5-flash-lite': 1000000,
    'gemini-2.0-flash': 1000000,
    'gemini-1.5-pro': 2000000,
    // OpenAI
    'gpt-5.2': 256000,
    'gpt-5.2-pro': 256000,
    'gpt-5.1': 256000,
    'gpt-5.1-thinking': 256000,
    'gpt-5': 256000,
    'o3': 200000,
    'o3-pro': 200000,
    'o4-mini': 200000,
    'o3-mini': 200000,
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    // Anthropic
    'claude-opus-4-5-20251101': 200000,
    'claude-opus-4-20250514': 200000,
    'claude-sonnet-4-20250514': 200000,
    'claude-3-7-sonnet-20250219': 200000,
    'claude-3-5-sonnet-20241022': 200000,
    'claude-3-5-haiku-20241022': 200000,
    'claude-3-opus-20240229': 200000,
    'claude-3-haiku-20240307': 200000,
    // xAI
    'grok-4.1': 256000,
    'grok-4.1-fast': 2000000,
    'grok-4': 256000,
    'grok-4-heavy': 256000,
    'grok-3': 128000,
    'grok-3-mini': 128000,
    'grok-2-vision-1212': 32000,
    'grok-2-image-1212': 32000
  };
  return contextWindows[model] || 128000;
};

/**
 * Estimate cost for a request (approximate)
 */
export const estimateCost = (model, inputTokens, outputTokens = 0) => {
  // Pricing per million tokens (input/output)
  const pricing = {
    // Gemini (free tier generous, paid tier)
    'gemini-3-pro': { input: 1.25, output: 5.00 },
    'gemini-3-flash': { input: 0.075, output: 0.30 },
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    // OpenAI
    'gpt-5.2': { input: 15.00, output: 60.00 },
    'gpt-5.1': { input: 10.00, output: 40.00 },
    'gpt-5': { input: 10.00, output: 40.00 },
    'o3': { input: 15.00, output: 60.00 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    // Anthropic
    'claude-opus-4-5-20251101': { input: 5.00, output: 25.00 },
    'claude-opus-4-20250514': { input: 15.00, output: 75.00 },
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
    // xAI
    'grok-4.1': { input: 3.00, output: 15.00 },
    'grok-3': { input: 2.00, output: 10.00 },
    'grok-3-mini': { input: 0.30, output: 1.50 }
  };

  const modelPricing = pricing[model] || { input: 1.00, output: 4.00 };
  const inputCost = (inputTokens / 1000000) * modelPricing.input;
  const outputCost = (outputTokens / 1000000) * modelPricing.output;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
};

/**
 * Smart model recommendation based on task type
 */
export const recommendModel = (taskDescription, availableKeys) => {
  const task = taskDescription.toLowerCase();

  const recommendations = [];

  // Coding tasks
  if (task.includes('code') || task.includes('programming') || task.includes('debug') || task.includes('function') || task.includes('api')) {
    if (availableKeys.anthropic) recommendations.push({ model: 'claude-opus-4-5-20251101', reason: 'Best for coding & agents' });
    if (availableKeys.openai) recommendations.push({ model: 'gpt-5.2', reason: 'Excellent for code generation' });
    if (availableKeys.xai) recommendations.push({ model: 'grok-4.1', reason: 'Strong coding capabilities' });
  }

  // Research/Analysis
  if (task.includes('research') || task.includes('analyze') || task.includes('study') || task.includes('investigate')) {
    if (availableKeys.gemini) recommendations.push({ model: 'gemini-3-pro', reason: 'Best for complex reasoning' });
    if (availableKeys.openai) recommendations.push({ model: 'o3', reason: 'PhD-level scientific reasoning' });
    if (availableKeys.anthropic) recommendations.push({ model: 'claude-opus-4-5-20251101', reason: 'Deep analytical capabilities' });
  }

  // Writing/Creative
  if (task.includes('write') || task.includes('creative') || task.includes('story') || task.includes('content') || task.includes('blog')) {
    if (availableKeys.anthropic) recommendations.push({ model: 'claude-3-5-sonnet-20241022', reason: 'Best for writing & creativity' });
    if (availableKeys.openai) recommendations.push({ model: 'gpt-5.1', reason: 'Warmer, more intelligent writing' });
    if (availableKeys.gemini) recommendations.push({ model: 'gemini-3-flash', reason: 'Fast creative generation' });
  }

  // Fast/Simple tasks
  if (task.includes('quick') || task.includes('simple') || task.includes('summarize') || task.includes('translate')) {
    if (availableKeys.gemini) recommendations.push({ model: 'gemini-3-flash', reason: 'Fast & efficient' });
    if (availableKeys.openai) recommendations.push({ model: 'gpt-4o-mini', reason: 'Quick & affordable' });
    if (availableKeys.anthropic) recommendations.push({ model: 'claude-3-5-haiku-20241022', reason: 'Speed optimized' });
    if (availableKeys.xai) recommendations.push({ model: 'grok-3-mini', reason: 'Fast responses' });
  }

  // Math/Reasoning
  if (task.includes('math') || task.includes('calculate') || task.includes('logic') || task.includes('reason')) {
    if (availableKeys.openai) recommendations.push({ model: 'o3', reason: 'Best mathematical reasoning' });
    if (availableKeys.gemini) recommendations.push({ model: 'gemini-3-deep-think', reason: 'Advanced reasoning' });
  }

  // Default recommendations if no specific match
  if (recommendations.length === 0) {
    if (availableKeys.gemini) recommendations.push({ model: 'gemini-3-flash', reason: 'Good all-around performance' });
    if (availableKeys.openai) recommendations.push({ model: 'gpt-4o', reason: 'Versatile multimodal model' });
    if (availableKeys.anthropic) recommendations.push({ model: 'claude-3-7-sonnet-20250219', reason: 'Balanced performance' });
    if (availableKeys.xai) recommendations.push({ model: 'grok-3', reason: 'General purpose' });
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
};

/**
 * Parse error and provide helpful suggestions
 */
export const parseErrorWithSuggestions = (error, provider) => {
  const errorStr = error.message || error.toString();

  const suggestions = [];

  if (errorStr.includes('401') || errorStr.includes('Unauthorized') || errorStr.includes('invalid_api_key')) {
    suggestions.push({
      type: 'api_key',
      message: 'Invalid API key',
      fix: `Check your ${provider} API key is correct`,
      link: provider === 'gemini' ? 'https://aistudio.google.com/apikey' :
            provider === 'openai' ? 'https://platform.openai.com/api-keys' :
            provider === 'anthropic' ? 'https://console.anthropic.com/settings/keys' :
            'https://console.x.ai/'
    });
  }

  if (errorStr.includes('429') || errorStr.includes('rate_limit') || errorStr.includes('quota')) {
    suggestions.push({
      type: 'rate_limit',
      message: 'Rate limit exceeded',
      fix: 'Wait a moment and try again, or upgrade your plan',
      link: null
    });
  }

  if (errorStr.includes('context_length') || errorStr.includes('too long') || errorStr.includes('max_tokens')) {
    suggestions.push({
      type: 'context',
      message: 'Input too long',
      fix: 'Try reducing your prompt or context length',
      link: null
    });
  }

  if (errorStr.includes('500') || errorStr.includes('503') || errorStr.includes('Service')) {
    suggestions.push({
      type: 'server',
      message: 'Server error',
      fix: 'The API service may be experiencing issues. Try again later.',
      link: null
    });
  }

  if (errorStr.includes('network') || errorStr.includes('fetch') || errorStr.includes('Failed to fetch')) {
    suggestions.push({
      type: 'network',
      message: 'Network error',
      fix: 'Check your internet connection and try again',
      link: null
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'unknown',
      message: 'Unknown error',
      fix: 'Please try again or check the console for details',
      link: null
    });
  }

  return {
    originalError: errorStr,
    suggestions
  };
};

/**
 * Build request body for provider
 */
const buildGeminiRequest = (systemPrompt, userPrompt, contextFiles, conversationHistory, userAttachments, globalMemory) => {
  const parts = [];

  if (globalMemory && globalMemory.length > 0) {
    parts.push({ text: "=== GLOBAL CONVERSATION LOG (Memory of previous agents) ===\n" + globalMemory + "\n=== END GLOBAL LOG ===\n\n" });
  }

  if (contextFiles?.length > 0) {
    parts.push({ text: "=== KNOWLEDGE BASE ===\n" });
    contextFiles.forEach(file => {
      if (file.type === 'application/pdf') {
        parts.push({ inlineData: { mimeType: "application/pdf", data: file.content } });
      } else {
        parts.push({ text: `[File: ${file.name}]\n${file.content}\n` });
      }
    });
    parts.push({ text: "\n=== END KNOWLEDGE ===\n\n" });
  }

  if (userAttachments?.length > 0) {
    userAttachments.forEach(file => {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        parts.push({ inlineData: { mimeType: file.type, data: file.content } });
      } else {
        parts.push({ text: `[User Attached File: ${file.name}]\n${file.content}\n` });
      }
    });
  }

  parts.push({ text: userPrompt });

  return {
    contents: [...conversationHistory, { role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7
    }
  };
};

const buildOpenAIMessages = (systemPrompt, userPrompt, contextFiles, conversationHistory, globalMemory) => {
  const messages = [];

  let fullSystemPrompt = systemPrompt;
  if (globalMemory) {
    fullSystemPrompt += "\n\n=== GLOBAL CONVERSATION LOG ===\n" + globalMemory + "\n=== END LOG ===";
  }
  messages.push({ role: "system", content: fullSystemPrompt });

  let contextText = "";
  if (contextFiles?.length > 0) {
    contextText = "=== KNOWLEDGE BASE ===\n";
    contextFiles.forEach(file => {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        contextText += `[File: ${file.name}]\n${file.content}\n`;
      }
    });
    contextText += "=== END KNOWLEDGE ===\n\n";
  }

  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: "user", content: msg.parts?.[0]?.text || "" });
    } else if (msg.role === 'model') {
      messages.push({ role: "assistant", content: msg.parts?.[0]?.text || "" });
    }
  });

  messages.push({ role: "user", content: contextText + userPrompt });

  return messages;
};

/**
 * Call Google Gemini API with streaming support
 */
const callGeminiStream = async (apiKey, model, systemPrompt, userPrompt, contextFiles, conversationHistory, userAttachments, globalMemory, onChunk) => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const cleanKey = apiKey.trim();
  const cleanModel = model.replace('models/', '');
  const requestBody = buildGeminiRequest(systemPrompt, userPrompt, contextFiles, conversationHistory, userAttachments, globalMemory);

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:streamGenerateContent?key=${cleanKey}&alt=sse`;

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(`Gemini API Error: ${errorMsg}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            fullText += text;
            onChunk(text, fullText);
          }
        } catch {}
      }
    }
  }

  return fullText;
};

/**
 * Call OpenAI API with streaming support
 */
const callOpenAIStream = async (apiKey, model, systemPrompt, userPrompt, contextFiles, conversationHistory, globalMemory, onChunk, endpoint = "https://api.openai.com/v1/chat/completions") => {
  if (!apiKey) throw new Error("API Key is missing");

  const messages = buildOpenAIMessages(systemPrompt, userPrompt, contextFiles, conversationHistory, globalMemory);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true
    })
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(`API Error: ${errorMsg}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data.choices?.[0]?.delta?.content || '';
          if (text) {
            fullText += text;
            onChunk(text, fullText);
          }
        } catch {}
      }
    }
  }

  return fullText;
};

/**
 * Call Anthropic Claude API with streaming support
 */
const callAnthropicStream = async (apiKey, model, systemPrompt, userPrompt, contextFiles, conversationHistory, globalMemory, onChunk) => {
  if (!apiKey) throw new Error("Anthropic API Key is missing");

  let fullSystemPrompt = systemPrompt;
  if (globalMemory) {
    fullSystemPrompt += "\n\n=== GLOBAL CONVERSATION LOG ===\n" + globalMemory + "\n=== END LOG ===";
  }

  let contextText = "";
  if (contextFiles?.length > 0) {
    contextText = "=== KNOWLEDGE BASE ===\n";
    contextFiles.forEach(file => {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        contextText += `[File: ${file.name}]\n${file.content}\n`;
      }
    });
    contextText += "=== END KNOWLEDGE ===\n\n";
  }

  const messages = [];
  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: "user", content: msg.parts?.[0]?.text || "" });
    } else if (msg.role === 'model') {
      messages.push({ role: "assistant", content: msg.parts?.[0]?.text || "" });
    }
  });
  messages.push({ role: "user", content: contextText + userPrompt });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey.trim(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      system: fullSystemPrompt,
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(`Anthropic API Error: ${errorMsg}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta') {
            const text = data.delta?.text || '';
            if (text) {
              fullText += text;
              onChunk(text, fullText);
            }
          }
        } catch {}
      }
    }
  }

  return fullText;
};

/**
 * Non-streaming calls (fallback)
 */
const callGemini = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const cleanKey = apiKey.trim();
  const cleanModel = model.replace('models/', '');
  const requestBody = buildGeminiRequest(systemPrompt, userPrompt, contextFiles, conversationHistory, userAttachments, globalMemory);

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(`Gemini API Error: ${errorMsg}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const callOpenAI = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("OpenAI API Key is missing");

  const messages = buildOpenAIMessages(systemPrompt, userPrompt, contextFiles, conversationHistory, globalMemory);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(`OpenAI API Error: ${errorMsg}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

const callAnthropic = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("Anthropic API Key is missing");

  let fullSystemPrompt = systemPrompt;
  if (globalMemory) {
    fullSystemPrompt += "\n\n=== GLOBAL CONVERSATION LOG ===\n" + globalMemory + "\n=== END LOG ===";
  }

  let contextText = "";
  if (contextFiles?.length > 0) {
    contextText = "=== KNOWLEDGE BASE ===\n";
    contextFiles.forEach(file => {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        contextText += `[File: ${file.name}]\n${file.content}\n`;
      }
    });
    contextText += "=== END KNOWLEDGE ===\n\n";
  }

  const messages = [];
  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: "user", content: msg.parts?.[0]?.text || "" });
    } else if (msg.role === 'model') {
      messages.push({ role: "assistant", content: msg.parts?.[0]?.text || "" });
    }
  });
  messages.push({ role: "user", content: contextText + userPrompt });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey.trim(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      system: fullSystemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(`Anthropic API Error: ${errorMsg}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
};

const callXAI = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("xAI API Key is missing");

  const messages = buildOpenAIMessages(systemPrompt, userPrompt, contextFiles, conversationHistory, globalMemory);

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(`xAI API Error: ${errorMsg}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

/**
 * Universal API caller with streaming support
 */
export const callAIStream = async (
  apiKeys,
  model,
  systemPrompt,
  userPrompt,
  contextFiles = [],
  conversationHistory = [],
  userAttachments = [],
  globalMemory = "",
  guardrailsEnabled = true,
  guardrailOverride = false,
  onChunk = () => {},
  guardrailSettings = null
) => {
  // Check guardrails before making API call
  if (guardrailsEnabled && !guardrailOverride) {
    const guardrailCheck = checkGuardrails(userPrompt, guardrailSettings);
    if (guardrailCheck.blocked) {
      return {
        blocked: true,
        reason: guardrailCheck.reason,
        category: guardrailCheck.category,
        categoryId: guardrailCheck.categoryId,
        icon: guardrailCheck.icon,
        severity: guardrailCheck.severity,
        matchedText: guardrailCheck.matchedText,
        canOverride: guardrailCheck.canOverride
      };
    }
  }

  const provider = getProviderFromModel(model);

  try {
    switch (provider) {
      case 'gemini':
        return await callGeminiStream(
          apiKeys.gemini, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, userAttachments, globalMemory, onChunk
        );

      case 'openai':
        return await callOpenAIStream(
          apiKeys.openai, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, globalMemory, onChunk
        );

      case 'anthropic':
        return await callAnthropicStream(
          apiKeys.anthropic, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, globalMemory, onChunk
        );

      case 'xai':
        return await callOpenAIStream(
          apiKeys.xai, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, globalMemory, onChunk,
          "https://api.x.ai/v1/chat/completions"
        );

      default:
        throw new Error(`Unknown provider for model: ${model}`);
    }
  } catch (error) {
    const parsed = parseErrorWithSuggestions(error, provider);
    throw { ...error, parsed };
  }
};

/**
 * Universal API caller - routes to appropriate provider (non-streaming)
 */
export const callAI = async (
  apiKeys,
  model,
  systemPrompt,
  userPrompt,
  contextFiles = [],
  conversationHistory = [],
  userAttachments = [],
  globalMemory = "",
  guardrailsEnabled = true,
  guardrailOverride = false,
  guardrailSettings = null
) => {
  // Check guardrails before making API call
  if (guardrailsEnabled && !guardrailOverride) {
    const guardrailCheck = checkGuardrails(userPrompt, guardrailSettings);
    if (guardrailCheck.blocked) {
      return {
        blocked: true,
        reason: guardrailCheck.reason,
        category: guardrailCheck.category,
        categoryId: guardrailCheck.categoryId,
        icon: guardrailCheck.icon,
        severity: guardrailCheck.severity,
        matchedText: guardrailCheck.matchedText,
        canOverride: guardrailCheck.canOverride
      };
    }
  }

  const provider = getProviderFromModel(model);

  try {
    switch (provider) {
      case 'gemini':
        return await callGemini(
          apiKeys.gemini, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, userAttachments, globalMemory
        );

      case 'openai':
        return await callOpenAI(
          apiKeys.openai, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, userAttachments, globalMemory
        );

      case 'anthropic':
        return await callAnthropic(
          apiKeys.anthropic, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, userAttachments, globalMemory
        );

      case 'xai':
        return await callXAI(
          apiKeys.xai, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, userAttachments, globalMemory
        );

      default:
        throw new Error(`Unknown provider for model: ${model}`);
    }
  } catch (error) {
    const parsed = parseErrorWithSuggestions(error, provider);
    throw { ...error, parsed };
  }
};

/**
 * Call multiple models in parallel for comparison
 */
export const callMultipleModels = async (
  apiKeys,
  models, // array of model IDs
  systemPrompt,
  userPrompt,
  contextFiles = [],
  conversationHistory = [],
  userAttachments = [],
  globalMemory = "",
  onProgress = () => {}
) => {
  const results = await Promise.allSettled(
    models.map(async (model, index) => {
      onProgress(model, 'starting', index);
      try {
        const result = await callAI(
          apiKeys, model, systemPrompt, userPrompt,
          contextFiles, conversationHistory, userAttachments, globalMemory,
          false, true // disable guardrails for comparison
        );
        onProgress(model, 'complete', index, result);
        return { model, result, status: 'success' };
      } catch (error) {
        onProgress(model, 'error', index, error);
        return { model, error: error.message, status: 'error' };
      }
    })
  );

  return results.map((r, i) => r.status === 'fulfilled' ? r.value : { model: models[i], error: r.reason?.message, status: 'error' });
};

export default callAI;
