import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot, Play, Plus, Trash2, Layers, X,
  Maximize2, Loader2, HardDrive,
  RotateCcw, ChevronUp, ChevronDown, Paperclip,
  Send, ArrowRight, FileText,
  Download, History, Rewind, GitCommit,
  AlertTriangle, Database, Shield, ShieldOff,
  BookOpen, Sparkles, Key, Check, Copy,
  RefreshCw, Edit3, GitBranch, Zap, BarChart3,
  ExternalLink, Share2, Expand, Lightbulb
} from 'lucide-react';

// Import components
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import SimpleMarkdown from './components/ui/SimpleMarkdown';

// Import services
import dbCore from './services/database';
import {
  callAI,
  callAIStream,
  callMultipleModels,
  getProviderFromModel,
  estimateTokens,
  getContextWindowSize,
  estimateCost,
  recommendModel
} from './services/api';
import { checkGuardrails, getGuardrailSystemPrompt } from './services/guardrails';

// Import data
import { DEFAULT_AGENTS, DEFAULT_WORKFLOW } from './data/defaultKnowledgeBases';
import { MODELS, MODEL_PROVIDERS, getAllModels, getModelById } from './data/models';

// Import utilities
import { downloadFile, copyToClipboard, readFile } from './utils/helpers';

// ========== MAIN APPLICATION ==========
export default function AgentOrchestrator() {

  // --- STATE ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // API Keys for multiple providers
  const [apiKeys, setApiKeys] = useState({
    gemini: "",
    openai: "",
    anthropic: "",
    xai: ""
  });
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Core state
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [workflow, setWorkflow] = useState(DEFAULT_WORKFLOW);
  const [isFreeMode, setIsFreeMode] = useState(false);

  // Runner State
  const [initialInput, setInitialInput] = useState("");
  const [executionState, setExecutionState] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(null);
  const [stepHistory, setStepHistory] = useState([]);
  const [currentStepOutput, setCurrentStepOutput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatFiles, setChatFiles] = useState([]);
  const [isProcessingStep, setIsProcessingStep] = useState(false);

  // Global Memory & History
  const [globalConversationMemory, setGlobalConversationMemory] = useState([]);
  const [savedRuns, setSavedRuns] = useState([]);
  const [pipelineFiles, setPipelineFiles] = useState([]);
  const [isGlobalMemoryEnabled, setIsGlobalMemoryEnabled] = useState(true);

  // Guardrails
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(true);
  const [guardrailOverride, setGuardrailOverride] = useState(false);
  const [guardrailWarning, setGuardrailWarning] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState("run");
  const [expandedAgents, setExpandedAgents] = useState({});
  const [maximizedPromptId, setMaximizedPromptId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGlobalMemory, setShowGlobalMemory] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});

  // Generator State
  const [showAgentGenerator, setShowAgentGenerator] = useState(false);
  const [agentGenDescription, setAgentGenDescription] = useState("");
  const [isGeneratingAgent, setIsGeneratingAgent] = useState(false);

  // Modal States
  const [genericConfirm, setGenericConfirm] = useState(null);
  const [genericAlert, setGenericAlert] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // NEW: Streaming & Enhanced UX State
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // NEW: Message editing
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editedMessageText, setEditedMessageText] = useState("");

  // NEW: Conversation branching
  const [conversationBranches, setConversationBranches] = useState([]);
  const [currentBranchId, setCurrentBranchId] = useState("main");

  // NEW: Model recommendations
  const [modelRecommendations, setModelRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // NEW: Multi-model comparison
  const [compareModelsEnabled, setCompareModelsEnabled] = useState(false);
  const [selectedCompareModels, setSelectedCompareModels] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // NEW: Agent suggestions
  const [suggestedAgents, setSuggestedAgents] = useState([]);

  // NEW: Expanded message view
  const [expandedMessageIndex, setExpandedMessageIndex] = useState(null);

  // NEW: Error with suggestions
  const [errorWithSuggestions, setErrorWithSuggestions] = useState(null);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- SCROLL TO BOTTOM ---
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stepHistory, isProcessingStep, streamingText]);

  // --- TOKEN ESTIMATION ---
  const tokenEstimate = useMemo(() => {
    if (!chatInput && chatFiles.length === 0) return null;

    const step = workflow[activeStepIndex];
    const agent = step ? agents.find(a => a.id === step.agentId) : null;
    if (!agent) return null;

    // Estimate input tokens
    let totalText = chatInput;
    chatFiles.forEach(f => { totalText += f.content || ''; });

    // Add context from knowledge base
    agent.knowledge.forEach(k => { totalText += k.content || ''; });

    // Add global memory
    const memoryText = globalConversationMemory.map(e => e.agentResponse).join('');
    totalText += memoryText;

    const inputTokens = estimateTokens(totalText);
    const contextWindow = getContextWindowSize(agent.model);
    const cost = estimateCost(agent.model, inputTokens, 2000); // Assume ~2000 output tokens

    return {
      inputTokens,
      contextWindow,
      percentUsed: Math.min(100, (inputTokens / contextWindow) * 100),
      estimatedCost: cost.totalCost
    };
  }, [chatInput, chatFiles, activeStepIndex, workflow, agents, globalConversationMemory]);

  // --- MODEL RECOMMENDATIONS ---
  useEffect(() => {
    if (chatInput.length > 10) {
      const recommendations = recommendModel(chatInput, apiKeys);
      setModelRecommendations(recommendations);
    } else {
      setModelRecommendations([]);
    }
  }, [chatInput, apiKeys]);

  // --- PERSISTENCE: LOAD ---
  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      try {
        const keys = await dbCore.load('apiKeys');
        const a = await dbCore.load('agents');
        const w = await dbCore.load('workflow');
        const fm = await dbCore.load('isFreeMode');
        const ge = await dbCore.load('guardrailsEnabled');
        const runs = await dbCore.loadAllRuns();

        if (mounted) {
          if (keys) setApiKeys(keys);
          if (a && Array.isArray(a) && a.length > 0 && a[0].knowledge?.length > 0) {
            setAgents(a);
          } else {
            setAgents(DEFAULT_AGENTS);
          }
          if (w?.length) setWorkflow(w); else setWorkflow(DEFAULT_WORKFLOW);
          if (fm !== undefined) setIsFreeMode(fm);
          if (ge !== undefined) setGuardrailsEnabled(ge);
          if (runs) setSavedRuns(runs.sort((a, b) => b.timestamp - a.timestamp));
          setIsLoaded(true);
        }
      } catch (e) {
        console.error(e);
        setIsLoaded(true);
      }
    };
    loadAll();
    return () => { mounted = false; };
  }, []);

  // --- PERSISTENCE: SAVE ---
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(async () => {
      setSaveStatus("saving");
      await dbCore.save('apiKeys', apiKeys);
      await dbCore.save('agents', agents);
      await dbCore.save('workflow', workflow);
      await dbCore.save('isFreeMode', isFreeMode);
      await dbCore.save('guardrailsEnabled', guardrailsEnabled);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 2000);
    return () => clearTimeout(t);
  }, [apiKeys, agents, workflow, isFreeMode, guardrailsEnabled, isLoaded]);

  // --- HISTORY MANAGEMENT ---
  const saveCurrentRun = async () => {
    const runData = {
      id: Date.now(),
      timestamp: Date.now(),
      name: `Run ${new Date().toLocaleTimeString()} - ${initialInput.substring(0, 30)}...`,
      logs: logs,
      globalMemory: globalConversationMemory,
      initialInput: initialInput
    };
    await dbCore.saveRun(runData);
    setSavedRuns(prev => [runData, ...prev]);
  };

  const requestLoadRun = (run) => {
    setGenericConfirm({
      title: "Load Session?",
      message: "Current progress will be lost. Resume this session?",
      confirmText: "Resume",
      variant: "primary",
      action: () => {
        setLogs(run.logs || []);
        setGlobalConversationMemory(run.globalMemory || []);
        setInitialInput(run.initialInput || "");

        let resumeIndex = (run.logs && run.logs.length > 0) ? run.logs.length - 1 : 0;
        if (resumeIndex >= workflow.length) resumeIndex = workflow.length - 1;
        if (resumeIndex < 0) resumeIndex = 0;

        setActiveStepIndex(resumeIndex);

        let restoredOutput = "";
        if (run.logs && run.logs[resumeIndex]) {
          restoredOutput = run.logs[resumeIndex].output;
        }
        setCurrentStepOutput(restoredOutput);

        const memoryForStep = run.globalMemory.filter(m => m.stepNumber === resumeIndex + 1);
        const reconstructedHistory = [];
        memoryForStep.forEach(entry => {
          reconstructedHistory.push({ role: 'user', parts: [{ text: entry.userMessage }] });
          reconstructedHistory.push({ role: 'model', parts: [{ text: entry.agentResponse }] });
        });

        if (reconstructedHistory.length === 0 && restoredOutput) {
          reconstructedHistory.push({ role: 'model', parts: [{ text: restoredOutput }] });
        }

        setStepHistory(reconstructedHistory);
        setExecutionState("interacting");
        setActiveTab("run");
        setGenericConfirm(null);
      }
    });
  };

  const requestDeleteRun = (id) => {
    setGenericConfirm({
      title: "Delete History?",
      message: "Are you sure you want to delete this session record? This cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      action: async () => {
        await dbCore.deleteRun(id);
        setSavedRuns(prev => prev.filter(r => r.id !== id));
        setGenericConfirm(null);
      }
    });
  };

  const summarizeRun = async (run) => {
    const summaryAgent = agents[0];
    const memoryText = run.globalMemory.map(e => `[${e.agentName}]: ${e.agentResponse}`).join('\n\n');
    const prompt = `Please summarize the following session history into a concise report:\n\n${memoryText}`;

    setIsSummarizing(true);
    try {
      const summary = await callAI(apiKeys, summaryAgent.model, "You are a summarizer.", prompt, [], [], [], "", false, true);
      downloadFile(`Summary_${run.id}.md`, summary, 'text/markdown');
    } catch (e) {
      setGenericAlert({ title: "Summarization Failed", message: e.message });
    } finally {
      setIsSummarizing(false);
    }
  };

  // --- AGENT GENERATOR ---
  const handleGenerateAgent = async () => {
    if (!apiKeys.gemini && !apiKeys.openai && !apiKeys.anthropic && !apiKeys.xai) {
      setGenericAlert({ title: "API Key Required", message: "Please enter at least one API key first." });
      return;
    }
    if (!agentGenDescription.trim()) return;

    setIsGeneratingAgent(true);
    const metaPrompt = `Create a configuration for an AI agent based on this user request: '${agentGenDescription}'.

    Return ONLY valid JSON with no markdown formatting. The JSON should have these keys:
    - 'name': A creative name for the agent (string)
    - 'prompt': A detailed, professional system instruction for the agent (string). Be thorough.
    - 'model': Suggested model (use 'gemini-2.5-flash' for fast tasks, 'gpt-4o' for complex reasoning, 'claude-3-5-sonnet-20241022' for writing).
    - 'color': A Tailwind CSS color class string. CHOOSE ONE from this list:
      'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700', 'bg-indigo-100 text-indigo-700'.`;

    try {
      // Use available API key
      const modelToUse = apiKeys.gemini ? "gemini-2.5-flash" : apiKeys.openai ? "gpt-4o-mini" : apiKeys.anthropic ? "claude-3-5-haiku-20241022" : "grok-3-mini";
      const result = await callAI(apiKeys, modelToUse, "You are an agent generator.", metaPrompt, [], [], [], "", false, true);

      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedData = JSON.parse(cleanJson);

      const newAgent = {
        id: Date.now().toString(),
        name: generatedData.name || "Generated Agent",
        model: generatedData.model || "gemini-2.5-flash",
        color: generatedData.color || "bg-gray-100 text-gray-600",
        prompt: generatedData.prompt || "You are a helpful assistant.",
        knowledge: []
      };

      setAgents(prev => [...prev, newAgent]);
      setShowAgentGenerator(false);
      setAgentGenDescription("");
      setExpandedAgents(prev => ({ ...prev, [newAgent.id]: true }));
    } catch (e) {
      setGenericAlert({ title: "Generation Failed", message: "Could not generate agent. Please try again.\n\nError: " + e.message });
    } finally {
      setIsGeneratingAgent(false);
    }
  };

  // --- MEMORY FORMATTING ---
  const formatGlobalMemory = () => {
    if (globalConversationMemory.length === 0) return "";
    return globalConversationMemory.map(entry =>
      `--- [${entry.timestamp}] ${entry.agentName} (Step ${entry.stepNumber}) ---\nUser: ${entry.userMessage}\nAgent: ${entry.agentResponse}\n---`
    ).join('\n\n');
  };

  const addToGlobalMemory = (agentName, stepNumber, userMessage, agentResponse) => {
    if (!isGlobalMemoryEnabled) return;

    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      agentName,
      stepNumber,
      userMessage: userMessage.substring(0, 500),
      agentResponse: agentResponse.substring(0, 2000)
    };
    setGlobalConversationMemory(prev => [...prev, newEntry]);
  };

  // --- HANDLERS ---
  const handleReset = async () => {
    await dbCore.wipe();
    window.location.reload();
  };

  const handleUpload = async (files, targetId, type) => {
    if (!files?.length) return;
    try {
      const processed = await Promise.all(Array.from(files).map(readFile));
      if (type === 'agent') {
        setAgents(prev => prev.map(a => a.id === targetId ? { ...a, knowledge: [...a.knowledge, ...processed] } : a));
      } else {
        setWorkflow(prev => prev.map(s => s.id === targetId ? { ...s, stepFiles: [...s.stepFiles, ...processed] } : s));
      }
    } catch (e) {
      setGenericAlert({ title: "Upload Failed", message: e.message });
    }
  };

  const handleChatUpload = async (files) => {
    if (!files?.length) return;
    try {
      const processed = await Promise.all(Array.from(files).map(readFile));
      setChatFiles(prev => [...prev, ...processed]);
    } catch (e) {
      setGenericAlert({ title: "Upload Failed", message: e.message });
    }
  };

  const removeFile = (targetId, fileName, type) => {
    if (type === 'agent') {
      setAgents(prev => prev.map(a => a.id === targetId ? { ...a, knowledge: a.knowledge.filter(k => k.name !== fileName) } : a));
    } else {
      setWorkflow(prev => prev.map(s => s.id === targetId ? { ...s, stepFiles: s.stepFiles.filter(f => f.name !== fileName) } : s));
    }
  };

  const deleteAgent = (id) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    setWorkflow(prev => prev.filter(w => w.agentId !== id));
  };

  // --- Check if API key is available for model ---
  const hasApiKeyForModel = (modelId) => {
    const provider = getProviderFromModel(modelId);
    return !!apiKeys[provider];
  };

  // --- NEW: MESSAGE EDITING & REGENERATION ---
  const handleEditMessage = (index) => {
    const msg = stepHistory[index];
    if (msg.role === 'user') {
      setEditingMessageIndex(index);
      setEditedMessageText(msg.parts[0].text);
    }
  };

  const handleSaveEdit = async () => {
    if (editingMessageIndex === null) return;

    // Create a branch point
    const branchId = `branch-${Date.now()}`;
    setConversationBranches(prev => [...prev, {
      id: branchId,
      parentBranch: currentBranchId,
      branchPoint: editingMessageIndex,
      history: [...stepHistory]
    }]);

    // Truncate history to edit point and set new message
    const newHistory = stepHistory.slice(0, editingMessageIndex);
    newHistory.push({ role: 'user', parts: [{ text: editedMessageText }] });
    setStepHistory(newHistory);
    setCurrentBranchId(branchId);
    setEditingMessageIndex(null);
    setEditedMessageText("");

    // Regenerate response
    setChatInput(editedMessageText);
    await handleAgentInteraction();
  };

  const handleRegenerateResponse = async (messageIndex) => {
    // Find the user message before this response
    const userMsgIndex = messageIndex - 1;
    if (userMsgIndex < 0 || stepHistory[userMsgIndex].role !== 'user') return;

    // Truncate history to before the response
    const newHistory = stepHistory.slice(0, messageIndex);
    setStepHistory(newHistory);

    // Re-run with same user message
    const userMessage = stepHistory[userMsgIndex].parts[0].text;
    setChatInput(userMessage);
    await handleAgentInteraction();
  };

  // --- NEW: CONVERSATION BRANCHING ---
  const handleCreateBranch = (atIndex) => {
    const branchId = `branch-${Date.now()}`;
    setConversationBranches(prev => [...prev, {
      id: branchId,
      parentBranch: currentBranchId,
      branchPoint: atIndex,
      history: [...stepHistory],
      timestamp: Date.now()
    }]);

    // Start new branch from this point
    setStepHistory(stepHistory.slice(0, atIndex + 1));
    setCurrentBranchId(branchId);
  };

  const handleSwitchBranch = (branchId) => {
    const branch = conversationBranches.find(b => b.id === branchId);
    if (branch) {
      setStepHistory([...branch.history]);
      setCurrentBranchId(branchId);
    }
  };

  // --- NEW: MULTI-MODEL COMPARISON ---
  const handleCompareModels = async () => {
    if (selectedCompareModels.length < 2) {
      setGenericAlert({ title: "Select Models", message: "Please select at least 2 models to compare." });
      return;
    }

    setIsComparing(true);
    setComparisonResults([]);

    const step = workflow[activeStepIndex];
    const agent = agents.find(a => a.id === step.agentId);
    const contextFiles = [...agent.knowledge];

    let systemPrompt = agent.prompt;
    if (guardrailsEnabled) {
      systemPrompt += "\n\n" + getGuardrailSystemPrompt();
    }

    try {
      const results = await callMultipleModels(
        apiKeys,
        selectedCompareModels,
        systemPrompt,
        chatInput,
        contextFiles,
        [],
        chatFiles,
        formatGlobalMemory(),
        (model, status, index, result) => {
          // Update progress
          setComparisonResults(prev => {
            const updated = [...prev];
            updated[index] = { model, status, result: status === 'complete' ? result : null };
            return updated;
          });
        }
      );

      setComparisonResults(results);
      setShowComparisonModal(true);
    } catch (err) {
      setGenericAlert({ title: "Comparison Failed", message: err.message });
    } finally {
      setIsComparing(false);
    }
  };

  const handleSelectComparisonResult = (result) => {
    // Use this result as the response
    setCurrentStepOutput(result.result);
    setStepHistory(prev => [
      ...prev,
      { role: 'user', parts: [{ text: chatInput }] },
      { role: 'model', parts: [{ text: result.result }], model: result.model }
    ]);
    addToGlobalMemory(agents.find(a => a.id === workflow[activeStepIndex].agentId)?.name, activeStepIndex + 1, chatInput, result.result);
    setChatInput("");
    setChatFiles([]);
    setShowComparisonModal(false);
    setCompareModelsEnabled(false);
    setSelectedCompareModels([]);
  };

  // --- NEW: AGENT SUGGESTIONS ---
  const generateAgentSuggestions = (currentOutput) => {
    const suggestions = [];
    const output = currentOutput.toLowerCase();

    agents.forEach(agent => {
      const agentPrompt = agent.prompt.toLowerCase();
      let score = 0;
      let reason = "";

      // Check if output mentions tasks this agent could help with
      if (output.includes('code') && agentPrompt.includes('code')) {
        score += 3;
        reason = "Can help with code mentioned in output";
      }
      if (output.includes('review') && agentPrompt.includes('review')) {
        score += 3;
        reason = "Can review the generated content";
      }
      if (output.includes('edit') && agentPrompt.includes('edit')) {
        score += 3;
        reason = "Can edit and refine the content";
      }
      if (output.includes('research') && agentPrompt.includes('research')) {
        score += 2;
        reason = "Can help research further";
      }
      if ((output.includes('next step') || output.includes('todo')) && agentPrompt.includes('plan')) {
        score += 2;
        reason = "Can help plan next steps";
      }

      if (score > 0) {
        suggestions.push({ agent, score, reason });
      }
    });

    // Sort by score and take top 3
    suggestions.sort((a, b) => b.score - a.score);
    setSuggestedAgents(suggestions.slice(0, 3));
  };

  // --- NEW: COPY/SHARE RESPONSE ---
  const handleCopyResponse = async (text, id) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleShareResponse = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Agent Response',
          text: text.substring(0, 500) + '...'
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to copy
      handleCopyResponse(text, 'share');
    }
  };

  // --- ENGINE: INIT & START ---
  const startPipeline = async () => {
    // Check if we have any API key
    if (!apiKeys.gemini && !apiKeys.openai && !apiKeys.anthropic && !apiKeys.xai) {
      return setLogs([{ step: 0, agentName: "System", status: "error", output: "Missing API Key. Please add at least one API key." }]);
    }

    setGlobalConversationMemory([]);
    if (isFreeMode) {
      setWorkflow([]);
      setExecutionState("choosing_next");
      setLogs([]);
      setPipelineFiles([]);
    } else {
      if (!workflow.length) return;
      setExecutionState("running");
      setLogs([]);
      setPipelineFiles([]);
      await initStep(0, initialInput);
    }
  };

  const initStep = async (index, inputPrompt) => {
    if (!isFreeMode && index >= workflow.length) {
      setExecutionState("complete");
      setActiveStepIndex(null);
      saveCurrentRun();
      return;
    }
    setActiveStepIndex(index);
    setStepHistory([]);
    setCurrentStepOutput("");
    setChatFiles([]);
    setIsProcessingStep(false);
    setChatInput(inputPrompt);
    setExecutionState("interacting");
  };

  // --- ENGINE: EXECUTE (LLM CALL) - WITH STREAMING ---
  const executeStep = async (index, userPrompt) => {
    setIsProcessingStep(true);
    setIsStreaming(true);
    setStreamingText("");
    setGuardrailWarning(null);
    setErrorWithSuggestions(null);

    const step = workflow[index];
    const agent = agents.find(a => a.id === step.agentId);

    // Check if we have API key for this model
    if (!hasApiKeyForModel(agent.model)) {
      setGenericAlert({
        title: "API Key Missing",
        message: `No API key configured for ${getProviderFromModel(agent.model).toUpperCase()}. Please add the API key in settings.`
      });
      setIsProcessingStep(false);
      setIsStreaming(false);
      return;
    }

    // RAG Context + Global Memory
    const contextFiles = [...agent.knowledge];
    step.stepFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });
    pipelineFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });

    let fullPrompt = index === 0 ? `GOAL:\n"${userPrompt}"\n\n` : `USER REQUEST:\n"${userPrompt}"\n\n`;
    if (step.taskPrompt) fullPrompt += `TASK INSTRUCTION:\n${step.taskPrompt}\n\n`;
    fullPrompt += "Respond based on your system instructions, knowledge base, and the global conversation context.";

    // Add guardrails to system prompt
    let systemPrompt = agent.prompt;
    if (guardrailsEnabled) {
      systemPrompt += "\n\n" + getGuardrailSystemPrompt();
    }

    try {
      const result = await callAIStream(
        apiKeys,
        agent.model,
        systemPrompt,
        fullPrompt,
        contextFiles,
        [],
        chatFiles,
        formatGlobalMemory(),
        guardrailsEnabled,
        guardrailOverride,
        (chunk, fullText) => {
          // Stream callback - update UI in real-time
          setStreamingText(fullText);
        }
      );

      // Check if blocked by guardrails
      if (result && typeof result === 'object' && result.blocked) {
        setGuardrailWarning({
          reason: result.reason,
          category: result.category,
          canOverride: result.canOverride
        });
        setIsProcessingStep(false);
        setIsStreaming(false);
        return;
      }

      const outputText = typeof result === 'string' ? result : JSON.stringify(result);
      setCurrentStepOutput(outputText);
      setStreamingText("");
      setStepHistory([{ role: 'user', parts: [{ text: fullPrompt }] }, { role: 'model', parts: [{ text: outputText }] }]);
      addToGlobalMemory(agent.name, index + 1, userPrompt, outputText);
      generateAgentSuggestions(outputText); // Generate suggestions based on output
      setIsProcessingStep(false);
      setIsStreaming(false);
      setChatInput("");
      setChatFiles([]);
      setGuardrailOverride(false);
      setExecutionState("interacting");
    } catch (err) {
      // Enhanced error handling with suggestions
      const errorInfo = err.parsed || { originalError: err.message, suggestions: [{ type: 'unknown', message: err.message, fix: 'Please try again' }] };
      setErrorWithSuggestions(errorInfo);
      setLogs(prev => [...prev, { step: index + 1, agentName: agent.name, status: "error", output: err.message }]);
      setStepHistory(prev => [...prev, { role: 'model', parts: [{ text: `**System Error:** ${err.message}` }] }]);
      setExecutionState("interacting");
      setIsProcessingStep(false);
      setIsStreaming(false);
    }
  };

  // --- ENGINE: INTERACTION LOOP - WITH STREAMING ---
  const handleAgentInteraction = async () => {
    if (activeStepIndex === null) return;

    // If compare mode is enabled, run comparison instead
    if (compareModelsEnabled && selectedCompareModels.length >= 2) {
      await handleCompareModels();
      return;
    }

    // Initial Run Trigger
    if (stepHistory.length === 0) {
      await executeStep(activeStepIndex, chatInput);
      return;
    }

    // Follow-up Chat
    if (!chatInput.trim() && chatFiles.length === 0) return;

    const step = workflow[activeStepIndex];
    const agent = agents.find(a => a.id === step.agentId);
    const userMessage = chatInput;
    const currentFiles = [...chatFiles];

    setChatInput("");
    setChatFiles([]);
    setIsProcessingStep(true);
    setIsStreaming(true);
    setStreamingText("");
    setGuardrailWarning(null);
    setErrorWithSuggestions(null);

    const contextFiles = [...agent.knowledge];
    step.stepFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });
    pipelineFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });

    let systemPrompt = agent.prompt;
    if (guardrailsEnabled) {
      systemPrompt += "\n\n" + getGuardrailSystemPrompt();
    }

    try {
      const result = await callAIStream(
        apiKeys,
        agent.model,
        systemPrompt,
        userMessage,
        contextFiles,
        stepHistory,
        currentFiles,
        formatGlobalMemory(),
        guardrailsEnabled,
        guardrailOverride,
        (chunk, fullText) => {
          setStreamingText(fullText);
        }
      );

      // Check if blocked by guardrails
      if (result && typeof result === 'object' && result.blocked) {
        setGuardrailWarning({
          reason: result.reason,
          category: result.category,
          canOverride: result.canOverride
        });
        setChatInput(userMessage);
        setChatFiles(currentFiles);
        setIsProcessingStep(false);
        setIsStreaming(false);
        return;
      }

      const outputText = typeof result === 'string' ? result : JSON.stringify(result);
      setCurrentStepOutput(outputText);
      setStreamingText("");

      let historyText = userMessage;
      if (currentFiles.length > 0) historyText += `\n[Attached ${currentFiles.length} file(s)]`;

      setStepHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: historyText }] },
        { role: 'model', parts: [{ text: outputText }] }
      ]);

      addToGlobalMemory(agent.name, activeStepIndex + 1, userMessage, outputText);
      generateAgentSuggestions(outputText); // Generate suggestions based on output
      setIsProcessingStep(false);
      setIsStreaming(false);
      setGuardrailOverride(false);
    } catch (err) {
      // Enhanced error handling with suggestions
      const errorInfo = err.parsed || { originalError: err.message, suggestions: [{ type: 'unknown', message: err.message, fix: 'Please try again' }] };
      setErrorWithSuggestions(errorInfo);
      setIsProcessingStep(false);
      setIsStreaming(false);
      setChatInput(userMessage);
      setChatFiles(currentFiles);
    }
  };

  // --- ENGINE: FINALIZE STEP & ADVANCE ---
  const proceedToNextAgent = () => {
    const step = workflow[activeStepIndex];
    const agent = agents.find(a => a.id === step.agentId);

    const newLog = {
      step: activeStepIndex + 1,
      agentName: agent.name,
      status: "complete",
      output: currentStepOutput
    };
    setLogs(prev => {
      const existing = prev.findIndex(l => l.step === activeStepIndex + 1);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = newLog;
        return copy;
      }
      return [...prev, newLog];
    });

    const newFile = {
      name: `Output_Step_${activeStepIndex + 1}_${agent.name}.md`,
      type: 'text/markdown',
      content: currentStepOutput
    };
    setPipelineFiles(prev => [...prev, newFile]);

    if (isFreeMode) {
      setExecutionState("choosing_next");
      setActiveStepIndex(null);
    } else {
      initStep(activeStepIndex + 1, currentStepOutput);
    }
  };

  // --- FREE MODE: ADD STEP ---
  const addFreeModeStep = (agentId) => {
    const newStep = {
      id: `step-${Date.now()}`,
      agentId: agentId,
      taskPrompt: "",
      stepFiles: []
    };
    const newWorkflow = [...workflow, newStep];
    setWorkflow(newWorkflow);

    let nextInput = initialInput;
    if (logs.length > 0) {
      nextInput = logs[logs.length - 1].output;
    }

    initStep(newWorkflow.length - 1, nextInput);
  };

  // --- ROLLBACK LOGIC ---
  const requestRollback = (targetStepIndex) => {
    setGenericConfirm({
      title: "Rewind Pipeline?",
      message: `Rewind to Step ${targetStepIndex + 1}? Future progress after this step will be lost.`,
      confirmText: "Rewind",
      variant: "danger",
      action: () => {
        if (isFreeMode) {
          const slicedWorkflow = workflow.slice(0, targetStepIndex + 1);
          setWorkflow(slicedWorkflow);
        }

        const keptLogs = logs.slice(0, targetStepIndex);
        setLogs(keptLogs);

        const slicedFiles = pipelineFiles.slice(0, targetStepIndex);
        setPipelineFiles(slicedFiles);

        const keptMemory = globalConversationMemory.filter(m => m.stepNumber <= targetStepIndex);
        setGlobalConversationMemory(keptMemory);

        let previousOutput = initialInput;
        if (targetStepIndex > 0) {
          previousOutput = slicedFiles[targetStepIndex - 1]?.content || "";
        }

        setExecutionState("interacting");
        initStep(targetStepIndex, previousOutput);
        setGenericConfirm(null);
      }
    });
  };

  // --- DOWNLOAD ALL OUTPUTS ---
  const downloadAllOutputs = () => {
    const fullContent = logs.map(log => {
      return `# ${log.agentName} - Step ${log.step}\n\n${log.output}\n\n---\n`;
    }).join('\n');
    downloadFile('Complete_Session_Output.md', fullContent, 'text/markdown');
  };

  // --- DOWNLOAD GLOBAL MEMORY ---
  const downloadGlobalMemory = () => {
    const content = formatGlobalMemory();
    downloadFile('Global_Conversation_Memory.md', content, 'text/markdown');
  };

  // --- COPY HANDLER ---
  const handleCopy = async (text, id) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // --- MODEL SELECTOR COMPONENT ---
  const ModelSelector = ({ value, onChange, className = "" }) => {
    const currentModel = getModelById(value);
    const currentProvider = currentModel ? MODEL_PROVIDERS[currentModel.provider] : null;

    return (
      <div className={className}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full text-sm border rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Object.entries(MODELS).map(([providerKey, models]) => {
            const provider = MODEL_PROVIDERS[providerKey];
            const hasKey = !!apiKeys[providerKey];
            return (
              <optgroup key={providerKey} label={`${provider.icon} ${provider.name} ${!hasKey ? '(No API Key)' : ''}`}>
                {models.map(model => (
                  <option key={model.id} value={model.id} disabled={!hasKey}>
                    {model.name} ({model.description})
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        {currentModel && (
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className={currentProvider?.color}>{currentProvider?.icon}</span>
            <span>{currentModel.contextWindow}</span>
            {!apiKeys[currentModel.provider] && (
              <span className="text-red-500">⚠️ No API key</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">

      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r flex flex-col shrink-0 z-20">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
            <Layers className="w-5 h-5" /> AgentOrchestrator
          </h1>
          <p className="text-xs text-gray-400 mt-1">V34 - Multi-Provider</p>
        </div>

        {/* API KEYS SECTION */}
        <div className="p-4 border-b bg-gray-50">
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase hover:text-gray-700"
          >
            <span className="flex items-center gap-1"><Key className="w-3 h-3" /> API Keys</span>
            {showApiKeys ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showApiKeys && (
            <div className="mt-3 space-y-3">
              {/* Gemini */}
              <div>
                <label className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                  🔷 Google Gemini
                  {apiKeys.gemini && <Check className="w-3 h-3 text-green-500" />}
                </label>
                <input
                  type="password"
                  value={apiKeys.gemini}
                  onChange={e => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                  className="w-full mt-1 p-2 text-xs border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="AIza..."
                />
              </div>

              {/* OpenAI */}
              <div>
                <label className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                  🟢 OpenAI
                  {apiKeys.openai && <Check className="w-3 h-3 text-green-500" />}
                </label>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={e => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                  className="w-full mt-1 p-2 text-xs border rounded focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="sk-..."
                />
              </div>

              {/* Anthropic */}
              <div>
                <label className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                  🟠 Anthropic Claude
                  {apiKeys.anthropic && <Check className="w-3 h-3 text-green-500" />}
                </label>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={e => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                  className="w-full mt-1 p-2 text-xs border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="sk-ant-..."
                />
              </div>

              {/* xAI Grok */}
              <div>
                <label className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                  ⚡ xAI Grok
                  {apiKeys.xai && <Check className="w-3 h-3 text-green-500" />}
                </label>
                <input
                  type="password"
                  value={apiKeys.xai}
                  onChange={e => setApiKeys(prev => ({ ...prev, xai: e.target.value }))}
                  className="w-full mt-1 p-2 text-xs border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="xai-..."
                />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <Button variant={activeTab === 'run' ? 'primary' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('run')}><Play className="w-4 h-4" /> Run Pipeline</Button>
          <Button variant={activeTab === 'history' ? 'primary' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('history')}><BookOpen className="w-4 h-4" /> Saved Sessions</Button>
          <Button variant={activeTab === 'workflow' ? 'primary' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('workflow')} disabled={isFreeMode}><Layers className="w-4 h-4" /> Edit Workflow</Button>
          <Button variant={activeTab === 'agents' ? 'primary' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('agents')}><Bot className="w-4 h-4" /> Agents</Button>
        </nav>

        <div className="p-3 border-t text-xs space-y-3">
          <label className={`flex items-center gap-2 cursor-pointer p-2 rounded border ${isFreeMode ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}>
            <input type="checkbox" checked={isFreeMode} onChange={e => setIsFreeMode(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <div className="flex flex-col">
              <span className="font-bold text-gray-800">Interactive Mode</span>
              <span className="text-[10px] text-gray-500">Choose next agent dynamically</span>
            </div>
          </label>

          {/* Guardrails Toggle */}
          <label className={`flex items-center gap-2 cursor-pointer p-2 rounded border ${guardrailsEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <input type="checkbox" checked={guardrailsEnabled} onChange={e => setGuardrailsEnabled(e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 flex items-center gap-1">
                {guardrailsEnabled ? <Shield className="w-3 h-3 text-green-600" /> : <ShieldOff className="w-3 h-3 text-red-600" />}
                Safety Guardrails
              </span>
              <span className="text-[10px] text-gray-500">{guardrailsEnabled ? 'Protection enabled' : 'Protection disabled'}</span>
            </div>
          </label>

          {globalConversationMemory.length > 0 && (
            <button
              onClick={() => setShowGlobalMemory(true)}
              className="w-full flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <Database className="w-3 h-3" />
              <span className="flex-1 text-left text-xs">Global Memory</span>
              <span className="bg-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {globalConversationMemory.length}
              </span>
            </button>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-gray-400 flex items-center gap-1">
              {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
              {saveStatus === 'saved' ? 'Saved' : 'Ready'}
            </span>
            <button onClick={() => setShowResetConfirm(true)} className="text-red-400 hover:text-red-600 p-1">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col relative">

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Session History</h2>
            {savedRuns.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No saved sessions found. Complete a pipeline run to see it here.</p>
              </div>
            )}
            <div className="space-y-4">
              {savedRuns.map(run => (
                <Card key={run.id} className="p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{run.name}</h3>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>{new Date(run.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span>{run.logs.length} Steps Completed</span>
                      <span>•</span>
                      <span>{run.globalMemory?.length || 0} Memory Entries</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="text-xs h-8"
                      onClick={() => summarizeRun(run)}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Summarize"}
                    </Button>
                    <Button
                      className="text-xs h-8"
                      onClick={() => requestLoadRun(run)}
                    >
                      Load Session
                    </Button>
                    <Button
                      variant="danger"
                      className="text-xs h-8 px-2"
                      onClick={() => requestDeleteRun(run.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* RUN TAB */}
        {activeTab === 'run' && (
          <div className="flex-1 overflow-hidden flex flex-row bg-gray-100">

            {/* 1. INPUT AREA (Only when idle) */}
            {executionState === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-8 space-y-6">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      {isFreeMode ? "Start Interactive Session" : "Start Linear Pipeline"}
                    </h2>
                    <p className="text-gray-500">
                      {isFreeMode ? "Build your workflow step-by-step. Choose agents as you go." : "Execute the pre-defined workflow sequence."}
                    </p>
                  </div>
                  <textarea
                    value={initialInput}
                    onChange={e => setInitialInput(e.target.value)}
                    className="w-full p-4 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                    placeholder="Enter your initial goal or project context..."
                  />
                  <Button onClick={startPipeline} className="w-full h-14 text-lg" disabled={!apiKeys.gemini && !apiKeys.openai && !apiKeys.anthropic && !apiKeys.xai}>
                    Begin Session <ArrowRight className="w-5 h-5" />
                  </Button>
                  {!apiKeys.gemini && !apiKeys.openai && !apiKeys.anthropic && !apiKeys.xai && (
                    <p className="text-center text-red-500 text-sm">Please add at least one API key to start</p>
                  )}
                </div>
              </div>
            )}

            {/* 2. CHOOSING NEXT AGENT (Free Mode) */}
            {executionState === 'choosing_next' && (
              <div className="flex-1 flex flex-col items-center justify-center p-10 bg-gray-50">
                <div className="w-full max-w-4xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Select Next Agent</h2>
                  <p className="text-gray-500 text-center mb-8">
                    Global Memory Active: {globalConversationMemory.length} entries available to all agents.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map(agent => {
                      const hasKey = hasApiKeyForModel(agent.model);
                      return (
                        <button
                          key={agent.id}
                          onClick={() => hasKey && addFreeModeStep(agent.id)}
                          disabled={!hasKey}
                          className={`bg-white p-4 rounded-xl shadow-sm border transition-all text-left group ${hasKey ? 'hover:border-indigo-500 hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${agent.color.split(' ')[0]}`}>
                              <Bot className={`w-6 h-6 ${agent.color.split(' ')[1]}`} />
                            </div>
                            <span className="font-bold text-gray-700 group-hover:text-indigo-600">{agent.name}</span>
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{agent.prompt.substring(0, 100)}...</p>
                          {!hasKey && <p className="text-xs text-red-500 mt-2">Missing API key for {getProviderFromModel(agent.model)}</p>}
                        </button>
                      );
                    })}
                  </div>
                  {logs.length > 0 && (
                    <div className="mt-8 text-center flex justify-center gap-4">
                      <Button variant="secondary" onClick={downloadAllOutputs}>
                        <Download className="w-4 h-4" /> Download All Outputs
                      </Button>
                      <Button variant="secondary" onClick={() => { setExecutionState('complete'); saveCurrentRun(); }}>
                        Finish & Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. ACTIVE RUNNER VIEW */}
            {(executionState === 'running' || executionState === 'interacting') && activeStepIndex !== null && (
              <>
                {/* LEFT SIDEBAR: HISTORY */}
                <div className="w-72 bg-white border-r flex flex-col overflow-y-auto shrink-0">
                  <div className="p-4 border-b bg-gray-50 font-bold text-xs text-gray-500 uppercase flex items-center gap-2">
                    <History className="w-4 h-4" /> Session History
                  </div>
                  <div className="p-2 space-y-2">
                    {workflow.slice(0, activeStepIndex + 1).map((step, idx) => {
                      const isCurrent = idx === activeStepIndex;
                      const hasLog = logs.find(l => l.step === idx + 1);

                      return (
                        <div key={idx} className={`text-sm border rounded-lg p-3 transition-all ${isCurrent ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white hover:bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${isCurrent ? 'text-indigo-700' : 'text-gray-700'}`}>
                              Step {idx + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              {hasLog && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const output = typeof hasLog.output === 'string' ? hasLog.output : JSON.stringify(hasLog.output);
                                    downloadFile(`Output_Step_${idx + 1}.md`, output, 'text/markdown');
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                  title="Download Output"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {(idx < activeStepIndex || (isCurrent && logs.length > idx)) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestRollback(idx);
                                  }}
                                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Rewind to this step"
                                >
                                  <Rewind className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${agents.find(a => a.id === step.agentId)?.color.split(' ')[1].replace('text', 'bg')}`} />
                            <span className="text-xs text-gray-600 truncate font-medium">
                              {agents.find(a => a.id === step.agentId)?.name}
                            </span>
                          </div>
                          {hasLog && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Output Preview</div>
                              <div className="text-xs bg-white border p-1.5 rounded text-gray-500 line-clamp-2 font-mono">
                                {typeof hasLog.output === 'string' ? hasLog.output.substring(0, 100) + "..." : "[Output]"}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MAIN CHAT AREA */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                  {/* Header with Progress Bar */}
                  <div className="bg-white border-b shadow-sm z-10">
                    <div className="px-6 py-3 flex justify-between items-center h-16">
                      <div>
                        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                          {agents.find(a => a.id === workflow[activeStepIndex].agentId)?.name}
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-normal border">
                            Step {activeStepIndex + 1} of {workflow.length}
                          </span>
                        </h2>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="text-xs h-8" onClick={() => { setExecutionState('idle'); setLogs([]); setPipelineFiles([]); setActiveStepIndex(null); }}>
                          Cancel Session
                        </Button>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    {!isFreeMode && workflow.length > 1 && (
                      <div className="px-6 pb-3">
                        <div className="flex items-center gap-1">
                          {workflow.map((step, idx) => {
                            const stepAgent = agents.find(a => a.id === step.agentId);
                            const isComplete = idx < activeStepIndex;
                            const isCurrent = idx === activeStepIndex;
                            const isPending = idx > activeStepIndex;

                            return (
                              <React.Fragment key={step.id}>
                                {idx > 0 && (
                                  <div className={`flex-1 h-0.5 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                                <div
                                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                                    isComplete ? 'bg-green-500 text-white' :
                                    isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                                    'bg-gray-200 text-gray-500'
                                  }`}
                                  title={stepAgent?.name}
                                >
                                  {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          {workflow.map((step, idx) => {
                            const stepAgent = agents.find(a => a.id === step.agentId);
                            return (
                              <div
                                key={step.id}
                                className={`text-[10px] truncate max-w-[80px] text-center ${
                                  idx === activeStepIndex ? 'text-indigo-600 font-medium' : 'text-gray-400'
                                }`}
                              >
                                {stepAgent?.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat History */}
                  <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50/50">
                    {activeStepIndex > 0 && stepHistory.length === 0 && (
                      <div className="flex justify-center">
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2">
                          <GitCommit className="w-3 h-3" /> Context loaded from previous steps & global memory
                        </div>
                      </div>
                    )}

                    {stepHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-3xl rounded-xl p-4 shadow-sm relative ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800'}`}>
                          {/* Message header with actions */}
                          <div className="flex items-center justify-between mb-1">
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {msg.role === 'model' ? 'Agent' : 'You'}
                              {msg.model && <span className="ml-2 font-normal">({getModelById(msg.model)?.name || msg.model})</span>}
                            </div>
                            {/* Message Actions */}
                            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {msg.role === 'user' && (
                                <button
                                  onClick={() => handleEditMessage(idx)}
                                  className="p-1 hover:bg-white/10 rounded"
                                  title="Edit message"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                              {msg.role === 'model' && (
                                <>
                                  <button
                                    onClick={() => handleRegenerateResponse(idx)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Regenerate response"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleCreateBranch(idx)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Create branch from here"
                                  >
                                    <GitBranch className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleCopyResponse(msg.parts[0].text, `msg-${idx}`)}
                                className={`p-1 rounded ${msg.role === 'user' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                title="Copy"
                              >
                                {copiedId === `msg-${idx}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              {msg.role === 'model' && (
                                <>
                                  <button
                                    onClick={() => downloadFile(`response-${idx}.md`, msg.parts[0].text, 'text/markdown')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Download"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setExpandedMessageIndex(expandedMessageIndex === idx ? null : idx)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Expand"
                                  >
                                    <Expand className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleShareResponse(msg.parts[0].text)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Share"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Edit mode for user messages */}
                          {editingMessageIndex === idx ? (
                            <div className="space-y-2">
                              <textarea
                                value={editedMessageText}
                                onChange={(e) => setEditedMessageText(e.target.value)}
                                className="w-full p-2 rounded border border-indigo-300 bg-indigo-700 text-white text-sm resize-none"
                                rows={4}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  className="text-xs h-7"
                                  onClick={() => { setEditingMessageIndex(null); setEditedMessageText(""); }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className="text-xs h-7 bg-white text-indigo-600"
                                  onClick={handleSaveEdit}
                                >
                                  Save & Regenerate
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''} ${expandedMessageIndex === idx ? '' : 'max-h-96 overflow-auto'}`}>
                              <SimpleMarkdown>{msg.parts[0].text}</SimpleMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Streaming response display */}
                    {isStreaming && streamingText && (
                      <div className="flex justify-start">
                        <div className="max-w-3xl rounded-xl p-4 shadow-sm bg-white border text-gray-800">
                          <div className="text-[10px] mb-1 font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            Agent <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <SimpleMarkdown>{streamingText}</SimpleMarkdown>
                            <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading indicator when not streaming yet */}
                    {isProcessingStep && !streamingText && (
                      <div className="flex justify-start">
                        <div className="bg-white border p-4 rounded-xl shadow-sm flex items-center gap-3 text-gray-600">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          <span className="text-sm font-medium">Connecting to AI...</span>
                        </div>
                      </div>
                    )}

                    {/* Agent Suggestions after response */}
                    {suggestedAgents.length > 0 && stepHistory.length > 0 && !isProcessingStep && isFreeMode && (
                      <div className="flex justify-center">
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 max-w-2xl">
                          <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-3">
                            <Lightbulb className="w-4 h-4" />
                            Suggested next agents:
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {suggestedAgents.map(({ agent, reason }) => (
                              <button
                                key={agent.id}
                                onClick={() => addFreeModeStep(agent.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${agent.color.split(' ')[0]}`}>
                                  <Bot className={`w-4 h-4 ${agent.color.split(' ')[1]}`} />
                                </div>
                                <div className="text-left">
                                  <div className="font-medium text-gray-700">{agent.name}</div>
                                  <div className="text-[10px] text-gray-500">{reason}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Guardrail Warning */}
                  {guardrailWarning && (
                    <div className="bg-amber-50 border-t border-amber-200 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-bold text-amber-800">Content Blocked: {guardrailWarning.category}</h4>
                          <p className="text-sm text-amber-700 mt-1">{guardrailWarning.reason}</p>
                          {guardrailWarning.canOverride && (
                            <div className="mt-3 flex items-center gap-3">
                              <label className="flex items-center gap-2 text-sm text-amber-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={guardrailOverride}
                                  onChange={e => setGuardrailOverride(e.target.checked)}
                                  className="rounded text-amber-600 focus:ring-amber-500"
                                />
                                I confirm this is legitimate use (e.g., my own data for grant writing)
                              </label>
                              {guardrailOverride && (
                                <Button variant="secondary" className="text-xs" onClick={handleAgentInteraction}>
                                  Retry with Override
                                </Button>
                              )}
                            </div>
                          )}
                          {!guardrailWarning.canOverride && (
                            <p className="text-xs text-amber-600 mt-2">This type of content cannot be overridden for safety reasons.</p>
                          )}
                        </div>
                        <button onClick={() => setGuardrailWarning(null)} className="text-amber-400 hover:text-amber-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error with Suggestions */}
                  {errorWithSuggestions && (
                    <div className="bg-red-50 border-t border-red-200 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-bold text-red-800">Error Occurred</h4>
                          <p className="text-sm text-red-700 mt-1 font-mono">{errorWithSuggestions.originalError}</p>
                          <div className="mt-3 space-y-2">
                            {errorWithSuggestions.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-amber-500" />
                                  <span className="font-medium text-gray-800">{suggestion.message}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{suggestion.fix}</p>
                                {suggestion.link && (
                                  <a
                                    href={suggestion.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mt-2"
                                  >
                                    Get API Key <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => setErrorWithSuggestions(null)} className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="bg-white border-t p-4">
                    <div className="max-w-4xl mx-auto space-y-3">
                      {/* Token & Context Indicator */}
                      {tokenEstimate && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>~{tokenEstimate.inputTokens.toLocaleString()} tokens</span>
                          </div>
                          <div className="flex-1 max-w-xs">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${tokenEstimate.percentUsed > 80 ? 'bg-red-500' : tokenEstimate.percentUsed > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${tokenEstimate.percentUsed}%` }}
                              />
                            </div>
                          </div>
                          <span>{tokenEstimate.percentUsed.toFixed(1)}% of context</span>
                          <span className="text-green-600">~${tokenEstimate.estimatedCost.toFixed(4)}</span>
                        </div>
                      )}

                      {/* Model Recommendations */}
                      {modelRecommendations.length > 0 && chatInput.length > 20 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-gray-500">Suggested:</span>
                          {modelRecommendations.map((rec, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const step = workflow[activeStepIndex];
                                const agent = agents.find(a => a.id === step.agentId);
                                if (agent) {
                                  setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, model: rec.model } : a));
                                }
                              }}
                              className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-700 hover:bg-amber-100"
                              title={rec.reason}
                            >
                              {getModelById(rec.model)?.name || rec.model}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* File Pills */}
                      {chatFiles.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {chatFiles.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-md text-xs border border-indigo-100 text-indigo-700">
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{file.name}</span>
                              <button onClick={() => setChatFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 items-end">
                        <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleChatUpload(e.target.files)} />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 border rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors mb-0.5" title="Attach file">
                          <Paperclip className="w-5 h-5" />
                        </button>

                        <div className="flex-1 relative">
                          <textarea
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder={stepHistory.length === 0 ? "Review instructions and run agent..." : "Refine output or ask follow-up..."}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 text-sm"
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAgentInteraction(); } }}
                          />
                          {stepHistory.length === 0 && (
                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                              Review Prompt
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Compare Models Toggle */}
                          {compareModelsEnabled ? (
                            <Button
                              onClick={handleCompareModels}
                              disabled={isComparing || selectedCompareModels.length < 2 || !chatInput.trim()}
                              className="h-10 bg-purple-600 hover:bg-purple-700"
                            >
                              {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                            </Button>
                          ) : (
                            <Button onClick={handleAgentInteraction} disabled={isProcessingStep || (!chatInput.trim() && chatFiles.length === 0)} className="h-10">
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {stepHistory.length > 0 && (
                            <Button onClick={proceedToNextAgent} variant="success" disabled={isProcessingStep} className="h-12 bg-green-600 hover:bg-green-700">
                              <span className="text-xs font-bold">NEXT</span> <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Options row */}
                      <div className="flex items-center justify-between mt-1 px-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none hover:text-indigo-600 transition-colors">
                            <input
                              type="checkbox"
                              checked={isGlobalMemoryEnabled}
                              onChange={e => setIsGlobalMemoryEnabled(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>Global Context</span>
                          </label>

                          {/* Multi-Model Comparison Toggle */}
                          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none hover:text-purple-600 transition-colors">
                            <input
                              type="checkbox"
                              checked={compareModelsEnabled}
                              onChange={e => {
                                setCompareModelsEnabled(e.target.checked);
                                if (!e.target.checked) {
                                  setSelectedCompareModels([]);
                                }
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                            />
                            <span>Compare Models</span>
                          </label>
                        </div>

                        {/* Conversation Branches */}
                        {conversationBranches.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <GitBranch className="w-3.5 h-3.5 text-gray-400" />
                            <select
                              value={currentBranchId}
                              onChange={(e) => handleSwitchBranch(e.target.value)}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="main">Main</option>
                              {conversationBranches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                  {branch.id.replace('branch-', 'Branch ')}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Model Selection for Comparison */}
                      {compareModelsEnabled && (
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <div className="text-xs font-medium text-purple-700 mb-2">Select 2+ models to compare:</div>
                          <div className="flex flex-wrap gap-2">
                            {getAllModels().filter(m => hasApiKeyForModel(m.id)).map((model) => (
                              <label
                                key={model.id}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${selectedCompareModels.includes(model.id) ? 'bg-purple-600 text-white' : 'bg-white border border-purple-200 text-gray-700 hover:bg-purple-100'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCompareModels.includes(model.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCompareModels(prev => [...prev, model.id]);
                                    } else {
                                      setSelectedCompareModels(prev => prev.filter(id => id !== model.id));
                                    }
                                  }}
                                  className="hidden"
                                />
                                {model.name}
                              </label>
                            ))}
                          </div>
                          {selectedCompareModels.length < 2 && (
                            <p className="text-[10px] text-purple-600 mt-2">Select at least 2 models</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 4. COMPLETE VIEW */}
            {executionState === 'complete' && (
              <div className="flex-1 overflow-auto p-10 bg-gray-50">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">Session Complete</h2>
                  <p className="text-gray-600">All steps have been executed. The session has been saved to History.</p>

                  <div className="flex justify-center gap-4 pt-4 flex-wrap">
                    <Button onClick={downloadAllOutputs} variant="secondary" className="px-6 py-3">
                      <Download className="w-4 h-4" /> Download All Outputs
                    </Button>
                    <Button onClick={downloadGlobalMemory} variant="secondary" className="px-6 py-3">
                      <Database className="w-4 h-4" /> Download Global Memory
                    </Button>
                    <Button onClick={() => { setExecutionState('idle'); setLogs([]); setPipelineFiles([]); setActiveStepIndex(null); }} variant="primary" className="px-8 py-3">
                      <RotateCcw className="w-4 h-4" /> Start New Session
                    </Button>
                  </div>

                  <div className="mt-12 text-left space-y-4">
                    {logs.map((log, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div
                          className="p-4 bg-white border-b flex justify-between items-center cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedLogs(prev => ({ ...prev, [i]: !prev[i] }))}
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-gray-700">Step {log.step}: {log.agentName}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const output = typeof log.output === 'string' ? log.output : JSON.stringify(log.output);
                                downloadFile(`Output_Step_${log.step}_${log.agentName}.md`, output, 'text/markdown');
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                              title="Download Output"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                          {expandedLogs[i] !== false ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                        {expandedLogs[i] !== false && (
                          <div className="p-6 bg-gray-50 text-sm whitespace-pre-wrap font-mono text-gray-700">
                            <SimpleMarkdown>{typeof log.output === 'string' ? log.output : JSON.stringify(log.output)}</SimpleMarkdown>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Agents Configuration</h2>
                <div className="flex gap-2">
                  <Button variant="magic" onClick={() => setShowAgentGenerator(true)}>
                    <Sparkles className="w-4 h-4" /> Magic Generate
                  </Button>
                  <Button onClick={() => {
                    const id = Date.now().toString();
                    setAgents(prev => [...prev, { id, name: "New Agent", model: "gemini-2.5-flash", color: "bg-gray-100 text-gray-600", prompt: "You are a helpful assistant. Use the GLOBAL CONVERSATION LOG for context from other agents.", knowledge: [] }]);
                    setExpandedAgents(p => ({ ...p, [id]: true }));
                  }}><Plus className="w-4 h-4" /> New Agent</Button>
                </div>
              </div>

              {agents.map(agent => (
                <Card key={agent.id}>
                  <div
                    className="p-4 flex gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedAgents(p => ({ ...p, [agent.id]: !p[agent.id] }))}
                  >
                    {expandedAgents[agent.id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${agent.color.split(' ')[0]}`}>
                      <Bot className={`w-6 h-6 ${agent.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        value={agent.name}
                        onChange={e => setAgents(prev => prev.map(ag => ag.id === agent.id ? { ...ag, name: e.target.value } : ag))}
                        onClick={e => e.stopPropagation()}
                        className="font-bold bg-transparent border-none p-0 focus:ring-0 outline-none w-full text-gray-800"
                      />
                      <div className="text-xs text-gray-400">{agent.model} • {agent.knowledge.length} files</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(agent.id);
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {expandedAgents[agent.id] && (
                    <div className="p-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-gray-500">SYSTEM PROMPT</label>
                          <button onClick={() => setMaximizedPromptId(agent.id)} className="text-indigo-600 hover:text-indigo-800 p-1">
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={agent.prompt}
                          onChange={e => setAgents(prev => prev.map(ag => ag.id === agent.id ? { ...ag, prompt: e.target.value } : ag))}
                          className="w-full h-32 p-3 border rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div>
                          <label className="text-xs font-bold text-gray-500 block mb-2">MODEL</label>
                          <ModelSelector
                            value={agent.model}
                            onChange={(value) => setAgents(prev => prev.map(ag => ag.id === agent.id ? { ...ag, model: value } : ag))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 block mb-2">COLOR</label>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              "bg-blue-100 text-blue-700",
                              "bg-purple-100 text-purple-700",
                              "bg-emerald-100 text-emerald-700",
                              "bg-amber-100 text-amber-700",
                              "bg-rose-100 text-rose-700",
                              "bg-cyan-100 text-cyan-700",
                              "bg-indigo-100 text-indigo-700"
                            ].map(color => (
                              <button
                                key={color}
                                onClick={() => setAgents(prev => prev.map(ag => ag.id === agent.id ? { ...ag, color } : ag))}
                                className={`w-8 h-8 rounded-full ${color.split(' ')[0]} ${agent.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div
                        className="border-2 border-dashed rounded-lg bg-gray-50 flex flex-col items-center justify-center p-4 relative min-h-48"
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50'); }}
                        onDragLeave={e => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50'); }}
                        onDrop={e => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50');
                          handleUpload(e.dataTransfer.files, agent.id, 'agent');
                        }}
                      >
                        <div className="text-center mb-3">
                          <div className="text-xs font-bold text-gray-500 mb-1">KNOWLEDGE BASE</div>
                          <div className="text-xs text-gray-400">Drag files here or click to upload</div>
                        </div>
                        <div className="flex-1 w-full overflow-auto max-h-32 space-y-1 relative z-10">
                          {agent.knowledge.map((f, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-2 rounded border text-xs relative z-10">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Download className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span
                                  className="truncate flex-1 cursor-pointer hover:text-indigo-600 hover:underline"
                                  onClick={(e) => { e.stopPropagation(); downloadFile(f.name, f.content, f.type); }}
                                >
                                  {f.name}
                                </span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); removeFile(agent.id, f.name, 'agent'); }} className="text-gray-400 hover:text-red-500 shrink-0 ml-2">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e.target.files, agent.id, 'agent')} />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- WORKFLOW TAB --- */}
        {activeTab === 'workflow' && (
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pipeline Editor</h2>
                <Button onClick={() => setWorkflow(prev => [...prev, { id: `step-${Date.now()}`, agentId: agents[0]?.id, taskPrompt: "", stepFiles: [] }])}>
                  <Plus className="w-4 h-4" /> Add Step
                </Button>
              </div>
              {workflow.map((step, index) => {
                const agent = agents.find(a => a.id === step.agentId);
                return (
                  <Card key={step.id} className="p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">{index + 1}</div>
                        <select
                          className="font-bold text-gray-700 border-none bg-transparent focus:ring-0 cursor-pointer"
                          value={step.agentId}
                          onChange={(e) => setWorkflow(prev => { const n = [...prev]; n[index].agentId = e.target.value; return n; })}
                        >
                          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <button onClick={() => setWorkflow(prev => prev.filter((_, i) => i !== index))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                      className="w-full border rounded p-3 text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Instructions for this step..."
                      value={step.taskPrompt}
                      onChange={(e) => setWorkflow(prev => { const n = [...prev]; n[index].taskPrompt = e.target.value; return n; })}
                    />
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* MODALS */}
        {maximizedPromptId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-10">
            <div className="bg-white w-full h-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <span className="font-bold">Edit System Prompt</span>
                <button onClick={() => setMaximizedPromptId(null)} className="p-1 hover:bg-gray-200 rounded"><X className="w-5 h-5" /></button>
              </div>
              <textarea
                className="flex-1 p-6 font-mono resize-none outline-none text-sm"
                value={agents.find(a => a.id === maximizedPromptId)?.prompt || ""}
                onChange={e => setAgents(prev => prev.map(a => a.id === maximizedPromptId ? { ...a, prompt: e.target.value } : a))}
              />
            </div>
          </div>
        )}

        {/* AGENT GENERATOR MODAL */}
        {showAgentGenerator && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 relative">
              <button
                onClick={() => setShowAgentGenerator(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Generate New Agent</h3>
                <p className="text-sm text-gray-500 mt-1">Describe what you want your agent to do, and AI will configure it for you.</p>
              </div>

              <textarea
                value={agentGenDescription}
                onChange={(e) => setAgentGenDescription(e.target.value)}
                placeholder="e.g., I want a creative writer who specializes in science fiction short stories, focusing on futuristic technology and human emotion..."
                className="w-full p-4 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none mb-4 text-sm"
              />

              <Button
                onClick={handleGenerateAgent}
                variant="magic"
                className="w-full h-12"
                disabled={isGeneratingAgent || !agentGenDescription.trim()}
              >
                {isGeneratingAgent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating Configuration...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Create Agent
                  </>
                )}
              </Button>
            </Card>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="p-6 max-w-sm">
              <h3 className="font-bold text-lg text-red-600 mb-2">Reset Everything?</h3>
              <p className="text-sm text-gray-600 mb-6">This will wipe all agents, history, settings, and global memory.</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
                <Button variant="danger" onClick={() => { handleReset(); setShowResetConfirm(false); }}>Reset</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Agent Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="p-6 max-w-sm">
              <h3 className="font-bold text-lg text-red-600 mb-2">Delete Agent?</h3>
              <p className="text-sm text-gray-600 mb-6">This will remove the agent and all workflow steps using it.</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                <Button variant="danger" onClick={() => { deleteAgent(showDeleteConfirm); setShowDeleteConfirm(null); }}>Delete</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Global Memory Modal */}
        {showGlobalMemory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <span className="font-bold flex items-center gap-2"><Database className="w-4 h-4" /> Global Conversation Memory</span>
                <div className="flex gap-2">
                  <Button variant="secondary" className="text-xs" onClick={downloadGlobalMemory}>
                    <Download className="w-3 h-3" /> Export
                  </Button>
                  <button onClick={() => setShowGlobalMemory(false)} className="p-1 hover:bg-gray-200 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {globalConversationMemory.length === 0 ? (
                  <p className="text-gray-400 text-center py-10">No memory entries yet.</p>
                ) : (
                  <div className="space-y-4">
                    {globalConversationMemory.map((entry, i) => (
                      <div key={entry.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-indigo-600">{entry.agentName}</span>
                          <span className="text-xs text-gray-400">Step {entry.stepNumber} • {new Date(entry.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1"><strong>User:</strong> {entry.userMessage}</div>
                        <div className="text-xs text-gray-700"><strong>Agent:</strong> {entry.agentResponse.substring(0, 200)}...</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Generic Confirm Modal */}
        {genericConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="p-6 max-w-sm m-4 shadow-xl">
              <h3 className={`font-bold text-lg mb-2 ${genericConfirm.variant === 'danger' ? 'text-red-600' : 'text-gray-800'}`}>
                {genericConfirm.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap">{genericConfirm.message}</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setGenericConfirm(null)}>Cancel</Button>
                <Button
                  variant={genericConfirm.variant || 'primary'}
                  onClick={genericConfirm.action}
                >
                  {genericConfirm.confirmText}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Generic Alert Modal */}
        {genericAlert && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="p-6 max-w-sm m-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg text-gray-800">{genericAlert.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap">{genericAlert.message}</p>
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setGenericAlert(null)}>OK</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Model Comparison Modal */}
        {showComparisonModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-lg text-gray-800">Model Comparison Results</h3>
                </div>
                <button onClick={() => setShowComparisonModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonResults.map((result, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className={`px-4 py-2 flex items-center justify-between ${result.status === 'success' ? 'bg-gray-50' : 'bg-red-50'}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{getModelById(result.model)?.name || result.model}</span>
                          {result.status === 'success' && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              {estimateTokens(result.result)} tokens
                            </span>
                          )}
                        </div>
                        {result.status === 'success' && (
                          <Button
                            variant="primary"
                            className="text-xs h-7"
                            onClick={() => handleSelectComparisonResult(result)}
                          >
                            Use This
                          </Button>
                        )}
                      </div>
                      <div className="p-4 max-h-64 overflow-auto">
                        {result.status === 'success' ? (
                          <div className="prose prose-sm max-w-none">
                            <SimpleMarkdown>{result.result}</SimpleMarkdown>
                          </div>
                        ) : (
                          <div className="text-red-600 text-sm">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="secondary" onClick={() => setShowComparisonModal(false)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
