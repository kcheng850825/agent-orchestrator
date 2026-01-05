/**
 * Multi-Provider AI API Service
 * Supports Google Gemini, OpenAI, and Anthropic Claude
 */

import { checkGuardrails } from './guardrails';

/**
 * Detect which provider a model belongs to
 */
export const getProviderFromModel = (model) => {
  if (model.startsWith('gemini-')) return 'gemini';
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  return 'gemini'; // default
};

/**
 * Call Google Gemini API
 */
const callGemini = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const cleanKey = apiKey.trim();
  const cleanModel = model.replace('models/', '');

  const parts = [];

  // Add Global Memory context
  if (globalMemory && globalMemory.length > 0) {
    parts.push({ text: "=== GLOBAL CONVERSATION LOG (Memory of previous agents) ===\n" + globalMemory + "\n=== END GLOBAL LOG ===\n\n" });
  }

  // Add Knowledge Base files
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

  // Add user attachments
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

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [...conversationHistory, { role: "user", parts }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7
      }
    })
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

  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  return "";
};

/**
 * Call OpenAI API
 */
const callOpenAI = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("OpenAI API Key is missing");

  const messages = [];

  // System prompt with guardrails
  let fullSystemPrompt = systemPrompt;
  if (globalMemory) {
    fullSystemPrompt += "\n\n=== GLOBAL CONVERSATION LOG ===\n" + globalMemory + "\n=== END LOG ===";
  }
  messages.push({ role: "system", content: fullSystemPrompt });

  // Add context files to the prompt
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

  // Convert conversation history
  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: "user", content: msg.parts?.[0]?.text || "" });
    } else if (msg.role === 'model') {
      messages.push({ role: "assistant", content: msg.parts?.[0]?.text || "" });
    }
  });

  // Add user prompt with context
  messages.push({ role: "user", content: contextText + userPrompt });

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

/**
 * Call Anthropic Claude API
 */
const callAnthropic = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("Anthropic API Key is missing");

  // Build system prompt with context
  let fullSystemPrompt = systemPrompt;
  if (globalMemory) {
    fullSystemPrompt += "\n\n=== GLOBAL CONVERSATION LOG ===\n" + globalMemory + "\n=== END LOG ===";
  }

  // Add context files
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

  // Convert conversation history
  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: "user", content: msg.parts?.[0]?.text || "" });
    } else if (msg.role === 'model') {
      messages.push({ role: "assistant", content: msg.parts?.[0]?.text || "" });
    }
  });

  // Add user prompt
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

/**
 * Universal API caller - routes to appropriate provider
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
  guardrailOverride = false
) => {
  // Check guardrails before making API call
  if (guardrailsEnabled && !guardrailOverride) {
    const guardrailCheck = checkGuardrails(userPrompt);
    if (guardrailCheck.blocked) {
      return {
        blocked: true,
        reason: guardrailCheck.reason,
        category: guardrailCheck.category
      };
    }
  }

  const provider = getProviderFromModel(model);

  switch (provider) {
    case 'gemini':
      return await callGemini(
        apiKeys.gemini,
        model,
        systemPrompt,
        userPrompt,
        contextFiles,
        conversationHistory,
        userAttachments,
        globalMemory
      );

    case 'openai':
      return await callOpenAI(
        apiKeys.openai,
        model,
        systemPrompt,
        userPrompt,
        contextFiles,
        conversationHistory,
        userAttachments,
        globalMemory
      );

    case 'anthropic':
      return await callAnthropic(
        apiKeys.anthropic,
        model,
        systemPrompt,
        userPrompt,
        contextFiles,
        conversationHistory,
        userAttachments,
        globalMemory
      );

    default:
      throw new Error(`Unknown provider for model: ${model}`);
  }
};

export default callAI;
