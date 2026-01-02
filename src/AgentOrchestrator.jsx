import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Play, Plus, Trash2, Layers, Save, X, 
  PauseCircle, Maximize2, Loader2, HardDrive, 
  RotateCcw, ChevronUp, ChevronDown, Paperclip, 
  Send, ArrowRight, FileText, Image as ImageIcon,
  Download, History, Rewind, Lock, GitCommit, Globe, 
  AlertTriangle, Database, MessageSquare, Copy, Check,
  BookOpen, Eye, ToggleLeft, ToggleRight, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- KB CONTENT CONSTANTS ---
const KB_00 = `# Context Builder Agent Knowledge Base

## Your Role
You are the **Context Agent** (also known as Agent 00). You are the architect of the "Master Context" file for the Nashville Analytics Grant Writing System. Your sole purpose is to gather, organize, and format organizational data so it can be used by other AI agents to write grants.

## Your Goal
Create a single, consolidated reference document (The Master Context) that contains rich, detailed information across 6 specific sections.

## IMPORTANT: TEAM COLLABORATION
You have access to a GLOBAL CONVERSATION LOG that contains all previous interactions from ALL agents in this session. Use this context to:
- Avoid asking for information that was already provided
- Build upon work done by other agents
- Maintain consistency across the entire workflow

## The Expanded Master Context Schema
### Section 1: Organization Identity (CRITICAL)
* Legal Name, EIN, & UEI Number
* Mission Statement
* Vision Statement
* Organizational Values
* History
* Unique Value Proposition

### Section 2: Programs & Impact (CRITICAL)
* Target Population & Service Area
* Current Programs
* Theory of Change

### Section 3: Strategic Compass (CRITICAL)
* Strategic Plan Period
* 3-5 Strategic Priorities
* Mission Drift Guardrails
* Current Key Challenges

### Section 4: Financial & Operational Specs (CRITICAL)
* Total Annual Operating Budget
* Fiscal Year Dates
* Fringe Benefit Rate
* Indirect Cost Strategy

### Section 5: Leadership & Staffing (RECOMMENDED)
* Executive Director Bio
* Key Program Staff
* Board Composition

### Section 6: Evidence of Success (RECOMMENDED)
* Quantitative Metrics
* Success Stories
* Awards/Recognitions`;

const KB_01 = `# Discovery Agent Knowledge Base

## Your Role
You are the Discovery Agent, specializing in finding and evaluating funding opportunities.

## IMPORTANT: TEAM COLLABORATION
You have access to a GLOBAL CONVERSATION LOG. Use context from the Context Agent's work to:
- Use organization details already gathered
- Reference the Master Context if available
- Build upon previous agent work

## Core Functions
- Search for relevant funders
- Assess mission alignment (1-5 scoring)
- Evaluate organizational readiness
- Provide PURSUE/SKIP/REVISIT recommendations
- Generate opportunity briefs

## OUTPUT: HANDOFF A
Always end with a structured handoff block for the Compliance Agent.`;

const KB_02 = `# Compliance Agent Knowledge Base

## Your Role
You are the Compliance Agent, the master of requirements extraction.

## IMPORTANT: TEAM COLLABORATION
Reference the GLOBAL CONVERSATION LOG to:
- Use opportunity details from Discovery Agent
- Cross-reference with organization context
- Ensure consistency with previous work

## Core Functions
- Extract all requirements from RFPs
- Create compliance checklists
- Identify mandatory vs optional items
- Flag deadlines and logistics

## OUTPUT: HANDOFF B
Always end with a structured requirements block.`;

const KB_03 = `# Narrative Agent Knowledge Base

## Your Role
You are the Narrative Agent, crafting compelling grant narratives.

## IMPORTANT: TEAM COLLABORATION
Use the GLOBAL CONVERSATION LOG to:
- Reference organization context from Agent 00
- Use opportunity details from Agent 01
- Follow requirements from Agent 02
- Maintain consistent voice and data

## Core Writing Principles
1. SPECIFIC OVER GENERAL - Use exact numbers
2. EVIDENCE-BASED - Cite all claims
3. ACTIVE VOICE - Strong, direct language
4. FUNDER-FOCUSED - Address their priorities

## OUTPUT: HANDOFF C
End with program variables for Budget Agent.`;

const KB_04 = `# Evidence Agent Knowledge Base

## Your Role
You are the Evidence Agent, ensuring all claims are validated.

## IMPORTANT: TEAM COLLABORATION
Use the GLOBAL CONVERSATION LOG to:
- Validate claims from Narrative Agent
- Cross-reference organization data
- Ensure citation consistency

## PII GUARDRAILS
Never process personally identifiable information.

## Core Functions
- Research and validate statistics
- Find authoritative sources
- Design evaluation frameworks
- Create proper citations

## OUTPUT: HANDOFF D
End with metrics framework.`;

const KB_05 = `# Budget Agent Knowledge Base

## Your Role
You are the Budget Agent, creating accurate budgets.

## IMPORTANT: TEAM COLLABORATION
Use the GLOBAL CONVERSATION LOG to:
- Match staffing from Narrative Agent
- Follow requirements from Compliance Agent
- Ensure alignment with program design

## ALIGNMENT CHECK PROTOCOL
Verify against HANDOFF C:
- Staffing levels match narrative
- Participant numbers consistent
- Activities funded properly

## OUTPUT: HANDOFF E
End with financial summary.`;

const KB_06 = `# Assembly Agent Knowledge Base

## Your Role
You are the Assembly Agent, the final integrator.

## IMPORTANT: TEAM COLLABORATION
You have access to the ENTIRE GLOBAL CONVERSATION LOG. Use it to:
- Verify consistency across ALL handoffs
- Detect any mismatches
- Create final submission package

## THE INTEGRATION PROTOCOL
Cross-check all handoffs (A through E) for consistency.

## OUTPUT: FINAL HANDOFF
Submission package status and checklist.`;

// --- DATABASE CONFIGURATION ---
const DB_NAME = 'AgentOrchestrator_V33_AIFeatures';
const STORE_NAME = 'app_state';
const HISTORY_STORE = 'run_history';
const DB_VERSION = 4;

// --- DATABASE CORE ---
const dbCore = {
  _db: null,
  
  open: () => new Promise((resolve, reject) => {
    if (dbCore._db) {
      resolve(dbCore._db);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => {
      dbCore._db = e.target.result;
      resolve(dbCore._db);
    };
    req.onerror = (e) => reject(e.target.error);
  }),

  save: async (key, data) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  load: async (key) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  // History methods
  saveRun: async (runData) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);
      store.put(runData);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  loadAllRuns: async () => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([HISTORY_STORE], 'readonly');
      const store = tx.objectStore(HISTORY_STORE);
      const req = store.getAll();
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  deleteRun: async (id) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  wipe: async () => {
    if (dbCore._db) {
      dbCore._db.close();
      dbCore._db = null;
    }
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
      req.onblocked = () => resolve();
    });
  }
};

// --- COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, title = "" }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
    outline: "border border-gray-300 text-gray-600 hover:bg-gray-50",
    magic: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm justify-center ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple Markdown renderer (no external dependency)
const SimpleMarkdown = ({ children }) => {
  if (!children || typeof children !== 'string') return null;
  
  const lines = children.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeContent = [];
  let codeLanguage = '';
  
  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeContent = [];
      } else {
        elements.push(
          <pre key={idx} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2 text-sm">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeContent = [];
      }
      return;
    }
    
    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }
    
    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={idx} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={idx} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={idx} className="ml-4">{line.slice(2)}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={idx} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={idx} className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-2">{line.slice(2)}</blockquote>);
    } else if (line.trim() === '') {
      elements.push(<br key={idx} />);
    } else {
      let formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
      elements.push(<p key={idx} className="my-1" dangerouslySetInnerHTML={{ __html: formatted }} />);
    }
  });
  
  return <div className="prose prose-sm max-w-none">{elements}</div>;
};

// --- CORS PROXIES ---
const CORS_PROXIES = [
  { name: 'corsproxy.io', url: '[https://corsproxy.io/](https://corsproxy.io/)?' },
  { name: 'allorigins', url: '[https://api.allorigins.win/raw?url=](https://api.allorigins.win/raw?url=)' },
  { name: 'cors.sh', url: '[https://cors.sh/](https://cors.sh/)' },
];

// --- API ---
const callGemini = async (apiKey, model, systemPrompt, userPrompt, contextFiles = [], conversationHistory = [], useCorsProxy = false, corsProxyIndex = 0, userAttachments = [], globalMemory = "") => {
  if (!apiKey) throw new Error("API Key is missing");
  const cleanKey = apiKey.trim();
  const cleanModel = model.replace('models/', '');

  const parts = [];
  
  // Add Global Memory context - THIS IS KEY FOR STATEFULNESS
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
  
  let fetchUrl = baseUrl;
  let fetchOptions = {
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
  };

  if (useCorsProxy) {
    const proxy = CORS_PROXIES[corsProxyIndex] || CORS_PROXIES[0];
    if (proxy.name === 'allorigins') {
      fetchUrl = proxy.url + encodeURIComponent(baseUrl);
    } else {
      fetchUrl = proxy.url + baseUrl;
    }
    if (proxy.name === 'cors.sh') {
      fetchOptions.headers['x-cors-api-key'] = 'temp_' + Math.random().toString(36).substring(7);
    }
  }

  const response = await fetch(fetchUrl, fetchOptions);

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const err = await response.json();
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  
  const data = await response.json();
  
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else if (data.contents) {
    return typeof data.contents === 'string' ? data.contents : JSON.stringify(data.contents);
  }
  
  return "";
};

// --- HELPER FUNCTIONS ---
const downloadFile = (fileName, content, mimeType = 'text/markdown') => {
  let blob;
  if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
    const byteCharacters = atob(content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    blob = new Blob([byteArray], { type: mimeType });
  } else {
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// --- MAIN APPLICATION ---
export default function AgentOrchestrator() {
  
  // --- DEFAULTS ---
  const DEFAULT_AGENTS = [
    { id: "00", name: "Context Agent", model: "gemini-2.5-flash", color: "bg-blue-100 text-blue-700", prompt: "You are the Context Agent. Read your knowledge base for instructions. You have access to the GLOBAL CONVERSATION LOG showing all previous interactions in this session.", knowledge: [{ name: "00_Context_Agent_KB.md", content: KB_00, type: "text/markdown" }] },
    { id: "01", name: "Discovery Agent", model: "gemini-2.5-flash", color: "bg-purple-100 text-purple-700", prompt: "You are the Discovery Agent. Read your knowledge base for instructions. Use the GLOBAL CONVERSATION LOG to reference work from other agents.", knowledge: [{ name: "01_Discovery_Agent_KB.md", content: KB_01, type: "text/markdown" }] },
    { id: "02", name: "Compliance Agent", model: "gemini-2.5-flash", color: "bg-emerald-100 text-emerald-700", prompt: "You are the Compliance Agent. Read your knowledge base for instructions. Reference the GLOBAL CONVERSATION LOG for context from other agents.", knowledge: [{ name: "02_Compliance_Agent_KB.md", content: KB_02, type: "text/markdown" }] },
    { id: "03", name: "Narrative Agent", model: "gemini-2.5-flash", color: "bg-amber-100 text-amber-700", prompt: "You are the Narrative Agent. Read your knowledge base for instructions. The GLOBAL CONVERSATION LOG contains all context you need from previous agents.", knowledge: [{ name: "03_Narrative_Agent_KB.md", content: KB_03, type: "text/markdown" }] },
    { id: "04", name: "Evidence Agent", model: "gemini-2.5-flash", color: "bg-rose-100 text-rose-700", prompt: "You are the Evidence Agent. Read your knowledge base for instructions. Use the GLOBAL CONVERSATION LOG to validate claims from other agents.", knowledge: [{ name: "04_Evidence_Agent_KB.md", content: KB_04, type: "text/markdown" }] },
    { id: "05", name: "Budget Agent", model: "gemini-2.5-flash", color: "bg-cyan-100 text-cyan-700", prompt: "You are the Budget Agent. Read your knowledge base for instructions. The GLOBAL CONVERSATION LOG contains program details you need for budgeting.", knowledge: [{ name: "05_Budget_Agent_KB.md", content: KB_05, type: "text/markdown" }] },
    { id: "06", name: "Assembly Agent", model: "gemini-2.5-flash", color: "bg-indigo-100 text-indigo-700", prompt: "You are the Assembly Agent. Read your knowledge base. You have the FULL GLOBAL CONVERSATION LOG to verify all work and create the final package.", knowledge: [{ name: "06_Assembly_Agent_KB.md", content: KB_06, type: "text/markdown" }] },
    { id: "07", name: "Agent Number", model: "gemini-2.5-flash-lite", color: "bg-orange-100 text-orange-700", prompt: "You give your message sequential information, you follow this rule rigoriously - every message you give, you start with 0001, and each address you increase the number to 0002, and then 0003 so on and so forth, EVEN when you are used for different workflow if the memories showed that you have a number in place already, you continue with that next number in the next message. \n\nall of your answer is always less than 10 words", knowledge: [] },
    { id: "08", name: "Agent Letter", model: "gemini-2.5-flash-lite", color: "bg-teal-100 text-teal-700", prompt: "Your give your message in letter sequential information, you follow this rule rigoriously - every message you give, you are with AAAA, and each address you increase the letters to AAAB, and then AAAC so on and so forth, EVEN when you are used for different workflow if the memories showed that you have a letter in place already, you continue with that next letter sets in the next message. \n\nall of your answer is always between 14 to 16 words, and you end the message with the word \"yo!\"", knowledge: [] }
  ];

  const DEFAULT_WORKFLOW = [
    { id: "step-00", agentId: "00", taskPrompt: "Initialize context.", stepFiles: [] },
    { id: "step-01", agentId: "01", taskPrompt: "Identify opportunities.", stepFiles: [] },
    { id: "step-02", agentId: "02", taskPrompt: "Check compliance.", stepFiles: [] },
    { id: "step-03", agentId: "03", taskPrompt: "Draft narrative.", stepFiles: [] },
    { id: "step-04", agentId: "04", taskPrompt: "Gather evidence.", stepFiles: [] },
    { id: "step-05", agentId: "05", taskPrompt: "Prepare budget.", stepFiles: [] },
    { id: "step-06", agentId: "06", taskPrompt: "Assemble final package.", stepFiles: [] },
  ];

  // --- STATE ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [apiKey, setApiKey] = useState("");
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [workflow, setWorkflow] = useState(DEFAULT_WORKFLOW);
  const [useCorsProxy, setUseCorsProxy] = useState(true);
  const [corsProxyIndex, setCorsProxyIndex] = useState(0);
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
  
  // *** GLOBAL MEMORY & HISTORY ***
  const [globalConversationMemory, setGlobalConversationMemory] = useState([]);
  const [savedRuns, setSavedRuns] = useState([]);
  const [pipelineFiles, setPipelineFiles] = useState([]);
  const [isGlobalMemoryEnabled, setIsGlobalMemoryEnabled] = useState(true); // NEW: Context Control

  // UI
  const [activeTab, setActiveTab] = useState("run");
  const [expandedAgents, setExpandedAgents] = useState({});
  const [maximizedPromptId, setMaximizedPromptId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGlobalMemory, setShowGlobalMemory] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});
  
  // Generator State (New for V33)
  const [showAgentGenerator, setShowAgentGenerator] = useState(false);
  const [agentGenDescription, setAgentGenDescription] = useState("");
  const [isGeneratingAgent, setIsGeneratingAgent] = useState(false);
  
  // --- CUSTOM MODAL STATES (Fixes for blocked alert/confirm) ---
  const [genericConfirm, setGenericConfirm] = useState(null); // { title, message, action, confirmText, variant }
  const [genericAlert, setGenericAlert] = useState(null); // { title, message }
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- SCROLL TO BOTTOM ---
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stepHistory, isProcessingStep]);

  // --- PERSISTENCE ---
  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      try {
        const k = await dbCore.load('apiKey');
        const a = await dbCore.load('agents');
        const w = await dbCore.load('workflow');
        const fm = await dbCore.load('isFreeMode');
        const cp = await dbCore.load('useCorsProxy');
        const cpi = await dbCore.load('corsProxyIndex');
        const runs = await dbCore.loadAllRuns();
        
        if (mounted) {
          if (k) setApiKey(k);
          if (a && Array.isArray(a) && a.length > 0 && a[0].knowledge?.length > 0) {
            setAgents(a);
          } else {
            setAgents(DEFAULT_AGENTS);
          }
          if (w?.length) setWorkflow(w); else setWorkflow(DEFAULT_WORKFLOW);
          if (fm !== undefined) setIsFreeMode(fm);
          if (cp !== undefined) setUseCorsProxy(cp);
          if (cpi !== undefined) setCorsProxyIndex(cpi);
          if (runs) setSavedRuns(runs.sort((a,b) => b.timestamp - a.timestamp));
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

  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(async () => {
      setSaveStatus("saving");
      await dbCore.save('apiKey', apiKey);
      await dbCore.save('agents', agents);
      await dbCore.save('workflow', workflow);
      await dbCore.save('isFreeMode', isFreeMode);
      await dbCore.save('useCorsProxy', useCorsProxy);
      await dbCore.save('corsProxyIndex', corsProxyIndex);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 2000);
    return () => clearTimeout(t);
  }, [apiKey, agents, workflow, isFreeMode, useCorsProxy, corsProxyIndex, isLoaded]);

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

  // REPLACEMENT FOR WINDOW.CONFIRM (LOAD)
  const requestLoadRun = (run) => {
    setGenericConfirm({
      title: "Load Session?",
      message: "Current progress will be lost. Resume this session?",
      confirmText: "Resume",
      variant: "primary",
      action: () => {
        // Restore logs and memory
        setLogs(run.logs || []);
        setGlobalConversationMemory(run.globalMemory || []);
        setInitialInput(run.initialInput || "");
        
        // Determine where to resume
        // If logs exist, resume at the last completed step
        let resumeIndex = (run.logs && run.logs.length > 0) 
            ? run.logs.length - 1 
            : 0;
        
        // SAFETY CHECK: Ensure resumeIndex is valid for the current workflow
        if (resumeIndex >= workflow.length) {
            resumeIndex = workflow.length - 1;
        }
        if (resumeIndex < 0) resumeIndex = 0;

        setActiveStepIndex(resumeIndex);
        
        // --- HISTORY RECONSTRUCTION MAGIC ---
        // 1. Try to fetch the output from the logs
        let restoredOutput = "";
        if (run.logs && run.logs[resumeIndex]) {
            restoredOutput = run.logs[resumeIndex].output;
        }
        setCurrentStepOutput(restoredOutput);

        // 2. Try to reconstruct the chat history from Global Memory
        // We filter for entries that match the current step number (resumeIndex + 1)
        const memoryForStep = run.globalMemory.filter(m => m.stepNumber === resumeIndex + 1);
        
        const reconstructedHistory = [];
        memoryForStep.forEach(entry => {
            reconstructedHistory.push({ role: 'user', parts: [{ text: entry.userMessage }] });
            reconstructedHistory.push({ role: 'model', parts: [{ text: entry.agentResponse }] });
        });

        // 3. Fallback: If no memory found (e.g. legacy run or isolated step), simulate the last output
        if (reconstructedHistory.length === 0 && restoredOutput) {
             reconstructedHistory.push({ role: 'model', parts: [{ text: restoredOutput }] });
        }

        setStepHistory(reconstructedHistory);
        
        // Set state to interacting so the UI shows the runner view
        setExecutionState("interacting"); 
        setActiveTab("run"); 
        setGenericConfirm(null);
      }
    });
  };

  // REPLACEMENT FOR WINDOW.CONFIRM (DELETE)
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

  // REPLACEMENT FOR ALERT (SUMMARIZE)
  const summarizeRun = async (run) => {
      const summaryAgent = agents[0]; 
      const memoryText = run.globalMemory.map(e => `[${e.agentName}]: ${e.agentResponse}`).join('\n\n');
      const prompt = `Please summarize the following session history into a concise report:\n\n${memoryText}`;
      
      setIsSummarizing(true);
      try {
          const summary = await callGemini(apiKey, summaryAgent.model, "You are a summarizer.", prompt, [], [], useCorsProxy, corsProxyIndex);
          downloadFile(`Summary_${run.id}.md`, summary, 'text/markdown');
      } catch(e) {
          setGenericAlert({ title: "Summarization Failed", message: e.message });
      } finally {
          setIsSummarizing(false);
      }
  };

  // --- AGENT GENERATOR (V33 Feature) ---
  const handleGenerateAgent = async () => {
    if (!apiKey) {
      setGenericAlert({ title: "API Key Required", message: "Please enter your Google AI API key first." });
      return;
    }
    if (!agentGenDescription.trim()) return;

    setIsGeneratingAgent(true);
    const metaPrompt = `Create a configuration for an AI agent based on this user request: '${agentGenDescription}'. 
    
    Return ONLY valid JSON with no markdown formatting. The JSON should have these keys:
    - 'name': A creative name for the agent (string)
    - 'prompt': A detailed, professional system instruction for the agent (string). Be thorough.
    - 'model': Suggested model (use 'gemini-2.5-flash' for fast tasks, 'gemini-2.5-pro' for complex reasoning).
    - 'color': A Tailwind CSS color class string. CHOOSE ONE from this list: 
      'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 
      'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700', 'bg-indigo-100 text-indigo-700'.`;

    try {
      // Use the first agent's model or default to flash
      const result = await callGemini(apiKey, "gemini-2.5-flash", "You are an agent generator.", metaPrompt, [], [], useCorsProxy, corsProxyIndex);
      
      // Clean result (remove markdown code blocks if present)
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
      setExpandedAgents(prev => ({ ...prev, [newAgent.id]: true })); // Auto-expand new agent
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
    // CONDITIONAL MEMORY ADDITION
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

  const readFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target.result;
      if (typeof content === 'string' && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        content = content.split(',')[1];
      }
      resolve({ name: file.name, type: file.type, content });
    };
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });

  const handleUpload = async (files, targetId, type) => {
    if (!files?.length) return;
    const processed = await Promise.all(Array.from(files).map(readFile));
    if (type === 'agent') {
      setAgents(prev => prev.map(a => a.id === targetId ? {...a, knowledge: [...a.knowledge, ...processed]} : a));
    } else {
      setWorkflow(prev => prev.map(s => s.id === targetId ? {...s, stepFiles: [...s.stepFiles, ...processed]} : s));
    }
  };
  
  const handleChatUpload = async (files) => {
    if (!files?.length) return;
    const processed = await Promise.all(Array.from(files).map(readFile));
    setChatFiles(prev => [...prev, ...processed]);
  };

  const removeFile = (targetId, fileName, type) => {
    if (type === 'agent') {
      setAgents(prev => prev.map(a => a.id === targetId ? {...a, knowledge: a.knowledge.filter(k => k.name !== fileName)} : a));
    } else {
      setWorkflow(prev => prev.map(s => s.id === targetId ? {...s, stepFiles: s.stepFiles.filter(f => f.name !== fileName)} : s));
    }
  };

  const deleteAgent = (id) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    setWorkflow(prev => prev.filter(w => w.agentId !== id));
  };

  // --- ENGINE: INIT & START ---
  const startPipeline = async () => {
    if (!apiKey) return setLogs([{step:0, agentName:"System", status:"error", output:"Missing API Key"}]);
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
      saveCurrentRun(); // Auto-save on completion
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

  // --- ENGINE: EXECUTE (LLM CALL) ---
  const executeStep = async (index, userPrompt) => {
    setIsProcessingStep(true);
    const step = workflow[index];
    const agent = agents.find(a => a.id === step.agentId);
    
    // RAG Context + Global Memory
    const contextFiles = [...agent.knowledge];
    step.stepFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });
    pipelineFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });
    
    let fullPrompt = index === 0 ? `GOAL:\n"${userPrompt}"\n\n` : `USER REQUEST:\n"${userPrompt}"\n\n`;
    if (step.taskPrompt) fullPrompt += `TASK INSTRUCTION:\n${step.taskPrompt}\n\n`;
    fullPrompt += "Respond based on your system instructions, knowledge base, and the global conversation context.";
    
    try {
      const result = await callGemini(
        apiKey, 
        agent.model, 
        agent.prompt, 
        fullPrompt, 
        contextFiles, 
        [], 
        useCorsProxy, 
        corsProxyIndex, 
        chatFiles, 
        formatGlobalMemory() // We always pass memory so agent sees history
      );
      
      const outputText = typeof result === 'string' ? result : JSON.stringify(result);
      setCurrentStepOutput(outputText);
      setStepHistory([{ role: 'user', parts: [{ text: fullPrompt }] }, { role: 'model', parts: [{ text: outputText }] }]);
      addToGlobalMemory(agent.name, index + 1, userPrompt, outputText);
      setIsProcessingStep(false);
      setChatInput("");
      setChatFiles([]);
      setExecutionState("interacting");
    } catch (err) {
      setLogs(prev => [...prev, { step: index+1, agentName: agent.name, status: "error", output: err.message }]);
      setStepHistory(prev => [...prev, { role: 'model', parts: [{ text: `**System Error:** ${err.message}` }] }]);
      setExecutionState("interacting");
      setIsProcessingStep(false);
    }
  };

  // --- ENGINE: INTERACTION LOOP ---
  const handleAgentInteraction = async () => {
    if (activeStepIndex === null) return;
    
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

    const contextFiles = [...agent.knowledge];
    step.stepFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });
    pipelineFiles.forEach(f => { if (!contextFiles.some(k => k.name === f.name)) contextFiles.push(f); });

    try {
      const result = await callGemini(
        apiKey, 
        agent.model, 
        agent.prompt, 
        userMessage, 
        contextFiles, 
        stepHistory, 
        useCorsProxy, 
        corsProxyIndex, 
        currentFiles,
        formatGlobalMemory() // We always pass memory so agent sees history
      );
      
      const outputText = typeof result === 'string' ? result : JSON.stringify(result);
      setCurrentStepOutput(outputText);
      
      let historyText = userMessage;
      if (currentFiles.length > 0) historyText += `\n[Attached ${currentFiles.length} file(s)]`;

      setStepHistory(prev => [
        ...prev, 
        { role: 'user', parts: [{ text: historyText }] }, 
        { role: 'model', parts: [{ text: outputText }] }
      ]);
      
      addToGlobalMemory(agent.name, activeStepIndex + 1, userMessage, outputText);
      setIsProcessingStep(false);
    } catch (err) {
      setIsProcessingStep(false);
      setChatInput(userMessage);
      setChatFiles(currentFiles);
      setGenericAlert({ title: "Interaction Failed", message: err.message });
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
           
           // Slice global memory to match rollback
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

  if (!isLoaded) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600"/></div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r flex flex-col shrink-0 z-20">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
            <Layers className="w-5 h-5" /> AgentOrchestrator
          </h1>
          <p className="text-xs text-gray-400 mt-1">V33 - AI Features</p>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <label className="text-xs font-bold text-gray-500 uppercase">API Key</label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)}
            className="w-full mt-1 p-2 text-xs border rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="Google AI Studio Key"
          />
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <Button variant={activeTab === 'run' ? 'primary' : 'outline'} className="w-full justify-start" onClick={()=>setActiveTab('run')}><Play className="w-4 h-4"/> Run Pipeline</Button>
          <Button variant={activeTab === 'history' ? 'primary' : 'outline'} className="w-full justify-start" onClick={()=>setActiveTab('history')}><BookOpen className="w-4 h-4"/> Saved Sessions</Button>
          <Button variant={activeTab === 'workflow' ? 'primary' : 'outline'} className="w-full justify-start" onClick={()=>setActiveTab('workflow')} disabled={isFreeMode}><Layers className="w-4 h-4"/> Edit Workflow</Button>
          <Button variant={activeTab === 'agents' ? 'primary' : 'outline'} className="w-full justify-start" onClick={()=>setActiveTab('agents')}><Bot className="w-4 h-4"/> Agents</Button>
        </nav>

        <div className="p-3 border-t text-xs space-y-3">
            <label className={`flex items-center gap-2 cursor-pointer p-2 rounded border ${isFreeMode ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}>
                <input type="checkbox" checked={isFreeMode} onChange={e => setIsFreeMode(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800">Interactive Mode</span>
                    <span className="text-[10px] text-gray-500">Choose next agent dynamically</span>
                </div>
            </label>

            <div className="space-y-1 pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                    <input type="checkbox" checked={useCorsProxy} onChange={e => setUseCorsProxy(e.target.checked)} className="rounded text-gray-500 focus:ring-indigo-500" />
                    <span className="text-gray-600 flex items-center gap-1">
                        <Globe className="w-3 h-3"/> Enable CORS Proxy
                    </span>
                </label>
                
                {useCorsProxy && (
                    <select 
                        value={corsProxyIndex} 
                        onChange={e => setCorsProxyIndex(Number(e.target.value))}
                        className="w-full text-[10px] border rounded p-1 bg-white"
                    >
                        {CORS_PROXIES.map((proxy, i) => (
                            <option key={i} value={i}>{proxy.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {globalConversationMemory.length > 0 && (
              <button 
                onClick={() => setShowGlobalMemory(true)}
                className="w-full flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <Database className="w-3 h-3"/>
                <span className="flex-1 text-left text-xs">Global Memory</span>
                <span className="bg-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {globalConversationMemory.length}
                </span>
              </button>
            )}
            
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-gray-400 flex items-center gap-1">
                    {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin"/> : <HardDrive className="w-3 h-3"/>}
                    {saveStatus === 'saved' ? 'Saved' : 'Ready'}
                </span>
                <button onClick={() => setShowResetConfirm(true)} className="text-red-400 hover:text-red-600 p-1">
                    <RotateCcw className="w-3 h-3"/>
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
                <History className="w-12 h-12 mx-auto mb-4 opacity-30"/>
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
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin"/> : "Summarize"}
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
                      <Trash2 className="w-4 h-4"/>
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
                            <Bot className="w-16 h-16 mx-auto text-indigo-600 mb-4"/>
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
                        <Button onClick={startPipeline} className="w-full h-14 text-lg" disabled={!apiKey}>
                            Begin Session <ArrowRight className="w-5 h-5"/>
                        </Button>
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
                             {agents.map(agent => (
                                 <button 
                                    key={agent.id}
                                    onClick={() => addFreeModeStep(agent.id)}
                                    className="bg-white p-4 rounded-xl shadow-sm border hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                                 >
                                     <div className="flex items-center gap-3 mb-2">
                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${agent.color.split(' ')[0]}`}>
                                             <Bot className={`w-6 h-6 ${agent.color.split(' ')[1]}`}/>
                                         </div>
                                         <span className="font-bold text-gray-700 group-hover:text-indigo-600">{agent.name}</span>
                                     </div>
                                     <p className="text-xs text-gray-400 line-clamp-2">{agent.prompt.substring(0, 100)}...</p>
                                 </button>
                             ))}
                         </div>
                         {logs.length > 0 && (
                             <div className="mt-8 text-center flex justify-center gap-4">
                                 <Button variant="secondary" onClick={downloadAllOutputs}>
                                     <Download className="w-4 h-4"/> Download All Outputs
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
                            <History className="w-4 h-4"/> Session History
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
                                                            downloadFile(`Output_Step_${idx+1}.md`, typeof hasLog.output === 'string' ? hasLog.output : JSON.stringify(hasLog.output), 'text/markdown');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                        title="Download Output"
                                                    >
                                                        <Download className="w-3.5 h-3.5"/>
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
                                                        <Rewind className="w-3.5 h-3.5"/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-2 h-2 rounded-full ${agents.find(a => a.id === step.agentId)?.color.split(' ')[1].replace('text', 'bg')}`}/>
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
                        {/* Header */}
                        <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-10 h-16">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    {agents.find(a => a.id === workflow[activeStepIndex].agentId)?.name}
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-normal border">
                                        Step {activeStepIndex + 1}
                                    </span>
                                </h2>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" className="text-xs h-8" onClick={() => {setExecutionState('idle'); setLogs([]); setPipelineFiles([]); setActiveStepIndex(null);}}>
                                    Cancel Session
                                </Button>
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50/50">
                            {activeStepIndex > 0 && stepHistory.length === 0 && (
                                <div className="flex justify-center">
                                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2">
                                        <GitCommit className="w-3 h-3"/> Context loaded from previous steps & global memory
                                    </div>
                                </div>
                            )}

                            {stepHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-3xl rounded-xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800'}`}>
                                        <div className={`text-[10px] mb-1 font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>{msg.role === 'model' ? 'Agent' : 'You'}</div>
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <SimpleMarkdown>{msg.parts[0].text}</SimpleMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {isProcessingStep && (
                                <div className="flex justify-start">
                                    <div className="bg-white border p-4 rounded-xl shadow-sm flex items-center gap-3 text-gray-600">
                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500"/> 
                                        <span className="text-sm font-medium">Generating response...</span>
                                    </div>
                                </div>
                            )}
                             <div style={{ float:"left", clear: "both" }}
                                ref={(el) => { if (el) el.scrollIntoView({ behavior: "smooth" }); }}>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="bg-white border-t p-4">
                            <div className="max-w-4xl mx-auto space-y-3">
                                {/* File Pills */}
                                {chatFiles.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {chatFiles.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-md text-xs border border-indigo-100 text-indigo-700">
                                                <FileText className="w-3 h-3"/>
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <button onClick={() => setChatFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 items-end">
                                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleChatUpload(e.target.files)}/>
                                    <button onClick={() => fileInputRef.current?.click()} className="p-3 border rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors mb-0.5" title="Attach file">
                                        <Paperclip className="w-5 h-5"/>
                                    </button>

                                    <div className="flex-1 relative">
                                        <textarea
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            placeholder={stepHistory.length === 0 ? "Review instructions and run agent..." : "Refine output or ask follow-up..."}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 text-sm"
                                            onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAgentInteraction(); }}}
                                        />
                                        {stepHistory.length === 0 && (
                                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                                Review Prompt
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <Button onClick={handleAgentInteraction} disabled={isProcessingStep || (!chatInput.trim() && chatFiles.length === 0)} className="h-10">
                                            <Send className="w-4 h-4"/>
                                        </Button>
                                        {stepHistory.length > 0 && (
                                            <Button onClick={proceedToNextAgent} variant="success" disabled={isProcessingStep} className="h-12 bg-green-600 hover:bg-green-700">
                                                <span className="text-xs font-bold">NEXT</span> <ArrowRight className="w-4 h-4"/>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-1">
                                   <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none hover:text-indigo-600 transition-colors">
                                      <input 
                                         type="checkbox" 
                                         checked={isGlobalMemoryEnabled} 
                                         onChange={e => setIsGlobalMemoryEnabled(e.target.checked)}
                                         className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                      />
                                      <div className="flex items-center gap-1">
                                        <Globe className="w-3 h-3"/>
                                        <span>Contribute to Global Context</span>
                                      </div>
                                   </label>
                                </div>
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
                            <Bot className="w-10 h-10"/>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">Session Complete</h2>
                        <p className="text-gray-600">All steps have been executed. The session has been saved to History.</p>
                        
                        <div className="flex justify-center gap-4 pt-4 flex-wrap">
                            <Button onClick={downloadAllOutputs} variant="secondary" className="px-6 py-3">
                                <Download className="w-4 h-4"/> Download All Outputs
                            </Button>
                            <Button onClick={downloadGlobalMemory} variant="secondary" className="px-6 py-3">
                                <Database className="w-4 h-4"/> Download Global Memory
                            </Button>
                            <Button onClick={() => {setExecutionState('idle'); setLogs([]); setPipelineFiles([]); setActiveStepIndex(null);}} variant="primary" className="px-8 py-3">
                                <RotateCcw className="w-4 h-4"/> Start New Session
                            </Button>
                        </div>

                        <div className="mt-12 text-left space-y-4">
                            {logs.map((log, i) => (
                              <Card key={i} className="overflow-hidden">
                                <div 
                                  className="p-4 bg-white border-b flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                  onClick={() => setExpandedLogs(prev => ({...prev, [i]: !prev[i]}))}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="font-bold text-gray-700">Step {log.step}: {log.agentName}</div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile({ 
                                            name: `Output_Step_${log.step}_${log.agentName}.md`, 
                                            content: typeof log.output === 'string' ? log.output : JSON.stringify(log.output), 
                                            type: 'text/markdown' 
                                        });
                                      }}
                                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                                      title="Download Output"
                                    >
                                      <Download className="w-4 h-4"/>
                                    </button>
                                  </div>
                                  {expandedLogs[i] !== false ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
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
                    setExpandedAgents(p => ({...p, [id]: true}));
                  }}><Plus className="w-4 h-4"/> New Agent</Button>
                </div>
              </div>
              
              {agents.map(agent => (
                <Card key={agent.id}>
                  <div 
                    className="p-4 flex gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors" 
                    onClick={() => setExpandedAgents(p => ({...p, [agent.id]: !p[agent.id]}))}
                  >
                    {expandedAgents[agent.id] ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${agent.color.split(' ')[0]}`}>
                      <Bot className={`w-6 h-6 ${agent.color.split(' ')[1]}`}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input 
                        value={agent.name} 
                        onChange={e => setAgents(prev => prev.map(ag => ag.id === agent.id ? {...ag, name: e.target.value} : ag))}
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
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                  {expandedAgents[agent.id] && (
                    <div className="p-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-gray-500">SYSTEM PROMPT</label>
                          <button onClick={() => setMaximizedPromptId(agent.id)} className="text-indigo-600 hover:text-indigo-800 p-1">
                            <Maximize2 className="w-4 h-4"/>
                          </button>
                        </div>
                        <textarea 
                          value={agent.prompt} 
                          onChange={e => setAgents(prev => prev.map(ag => ag.id === agent.id ? {...ag, prompt: e.target.value} : ag))}
                          className="w-full h-32 p-3 border rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                        <div>
                          <label className="text-xs font-bold text-gray-500 block mb-2">MODEL</label>
                          <select 
                            value={agent.model} 
                            onChange={e => setAgents(prev => prev.map(ag => ag.id === agent.id ? {...ag, model: e.target.value} : ag))}
                            className="w-full text-sm border rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <optgroup label="Gemini 2.5">
                              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                            </optgroup>
                            <optgroup label="Gemini 2.0">
                              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                              <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                            </optgroup>
                            <optgroup label="Gemini 1.5">
                              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                            </optgroup>
                          </select>
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
                                onClick={() => setAgents(prev => prev.map(ag => ag.id === agent.id ? {...ag, color} : ag))}
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
                                <Download className="w-3 h-3 text-indigo-500 shrink-0"/>
                                <span 
                                  className="truncate flex-1 cursor-pointer hover:text-indigo-600 hover:underline"
                                  onClick={(e) => { e.stopPropagation(); downloadFile(f.name, f.content, f.type); }}
                                >
                                  {f.name}
                                </span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); removeFile(agent.id, f.name, 'agent'); }} className="text-gray-400 hover:text-red-500 shrink-0 ml-2">
                                <X className="w-4 h-4"/>
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
                       <Plus className="w-4 h-4"/> Add Step
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
                             <button onClick={() => setWorkflow(prev => prev.filter((_, i) => i !== index))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
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
                <button onClick={() => setMaximizedPromptId(null)} className="p-1 hover:bg-gray-200 rounded"><X className="w-5 h-5"/></button>
              </div>
              <textarea 
                className="flex-1 p-6 font-mono resize-none outline-none text-sm"
                value={agents.find(a => a.id === maximizedPromptId)?.prompt || ""}
                onChange={e => setAgents(prev => prev.map(a => a.id === maximizedPromptId ? {...a, prompt: e.target.value} : a))}
              />
            </div>
          </div>
        )}

        {/* AGENT GENERATOR MODAL (V33) */}
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

        {/* --- NEW GENERIC CONFIRM MODAL --- */}
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

        {/* --- NEW GENERIC ALERT MODAL --- */}
        {genericAlert && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="p-6 max-w-sm m-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500"/>
                <h3 className="font-bold text-lg text-gray-800">{genericAlert.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap">{genericAlert.message}</p>
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setGenericAlert(null)}>OK</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}