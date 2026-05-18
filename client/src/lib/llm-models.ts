export interface LLMModel {
  id: string;
  label: string;
  sizeLabel: string;
  sizeMB: number;
  hfRepo: string;
  dtype: string;
  requiresToken: boolean;
  description: string;
  device: "webgpu" | "wasm" | "auto";
}

export const LLM_MODELS: LLMModel[] = [
  {
    id: "onnx-community/Qwen2.5-0.5B-Instruct",
    label: "Qwen2.5-0.5B",
    sizeLabel: "~400 MB",
    sizeMB: 400,
    hfRepo: "onnx-community/Qwen2.5-0.5B-Instruct",
    dtype: "q4",
    requiresToken: false,
    description: "Smallest model — fastest download, good for quick tasks",
    device: "webgpu",
  },
  {
    id: "onnx-community/Qwen2.5-1.5B-Instruct",
    label: "Qwen2.5-1.5B",
    sizeLabel: "~1 GB",
    sizeMB: 1000,
    hfRepo: "onnx-community/Qwen2.5-1.5B-Instruct",
    dtype: "q4",
    requiresToken: false,
    description: "Balanced — better reasoning, still fast",
    device: "webgpu",
  },
  {
    id: "onnx-community/gemma-3-1b-it-ONNX",
    label: "Gemma-3-1B-IT",
    sizeLabel: "~600 MB",
    sizeMB: 600,
    hfRepo: "onnx-community/gemma-3-1b-it-ONNX",
    dtype: "q4",
    requiresToken: true,
    description: "Google Gemma 3 ONNX — requires HF token",
    device: "webgpu",
  },
  {
    id: "spwotton/bonsai-ternary-webgpu",
    label: "Bonsai Ternary",
    sizeLabel: "~200 MB",
    sizeMB: 200,
    hfRepo: "spwotton/bonsai-ternary-webgpu",
    dtype: "q4",
    requiresToken: true,
    description: "Custom ternary WebGPU model — requires HF token",
    device: "webgpu",
  },
];

export const DEFAULT_MODEL_ID = LLM_MODELS[0].id;

export interface AgentRole {
  id: string;
  label: string;
  color: string;
  systemPrompt: string;
}

export const AGENT_ROLES: AgentRole[] = [
  {
    id: "designer",
    label: "Designer",
    color: "#7c3aed",
    systemPrompt:
      "You are a UI/UX Designer agent. Analyse the input and propose clear, user-centred design decisions, component layouts, and information architecture. Be concise and structured.",
  },
  {
    id: "coder",
    label: "Coder",
    color: "#0ea5e9",
    systemPrompt:
      "You are a Software Engineer agent specialising in code quality and efficiency. Analyse the input and propose clean, optimised implementation strategies, data structures, and algorithms. Use TypeScript idioms.",
  },
  {
    id: "engineer",
    label: "Engineer",
    color: "#10b981",
    systemPrompt:
      "You are a Systems Engineer agent. Analyse the input and propose robust, scalable architecture decisions, error-handling strategies, and performance optimisations.",
  },
  {
    id: "analyst",
    label: "SIGINT Analyst",
    color: "#f59e0b",
    systemPrompt:
      "You are a SIGINT analyst. Analyse incoming signal intelligence events for threat relevance, temporal patterns, and anomalies. Produce a concise threat summary.",
  },
  {
    id: "hypervisor",
    label: "Hypervisor",
    color: "#ef4444",
    systemPrompt:
      "You are the Hypervisor Synthesis Layer. You receive outputs from all lower layers (Designer, Coder, Engineer, Analyst) and synthesise them into a single coherent, actionable response. Apply weighted composition: blend perspectives by relevance and confidence. Eliminate contradictions. Output a unified synthesis.",
  },
  {
    id: "threat-hunter",
    label: "Threat Hunter",
    color: "#dc2626",
    systemPrompt:
      "You are a Threat Hunter agent. Proactively search for indicators of compromise, lateral movement, and adversarial tactics within the provided data. Identify kill-chain phases and recommend mitigations concisely.",
  },
  {
    id: "red-team",
    label: "Red Team",
    color: "#b91c1c",
    systemPrompt:
      "You are a Red Team agent. Identify attack surfaces, exploit chains, and adversarial opportunities in the described system. Think like an attacker and enumerate vulnerabilities with concise severity ratings.",
  },
  {
    id: "strategist",
    label: "Strategist",
    color: "#1d4ed8",
    systemPrompt:
      "You are a Strategic Analyst agent. Assess the long-term implications of the presented information. Identify second-order effects, geopolitical context, and recommended strategic responses.",
  },
  {
    id: "data-scientist",
    label: "Data Scientist",
    color: "#0d9488",
    systemPrompt:
      "You are a Data Scientist agent. Extract statistical patterns, anomalies, and correlations from the provided data. Suggest quantitative models, feature engineering approaches, and confidence intervals.",
  },
  {
    id: "writer",
    label: "Technical Writer",
    color: "#6b7280",
    systemPrompt:
      "You are a Technical Writer agent. Summarise and structure the provided information clearly for a broad audience. Use plain language, logical structure, and avoid unnecessary jargon.",
  },
  {
    id: "devil",
    label: "Devil's Advocate",
    color: "#9333ea",
    systemPrompt:
      "You are a Devil's Advocate agent. Challenge every assumption in the input. Identify logical fallacies, missing evidence, and alternative explanations. Your goal is constructive criticism that stress-tests the analysis.",
  },
];

export type AgentRoleId = string;

export type BlendMode = "normal" | "add" | "multiply" | "screen" | "difference";

export interface HypervisorAgent {
  id: string;
  roleId: AgentRoleId;
  customSystemPrompt?: string;
  output: string;
  status: "idle" | "queued" | "running" | "done" | "error";
  tokenCount: number;
}

export interface HypervisorLayer {
  id: string;
  name: string;
  opacity: number;
  blendMode: BlendMode;
  isHidden: boolean;
  mask: string;
  agents: HypervisorAgent[];
  subLayers: HypervisorLayer[];
  isExpanded: boolean;
}

export function makeDefaultLayers(): HypervisorLayer[] {
  return [
    {
      id: "layer-kappa",
      name: "KAPPA Context",
      opacity: 0.6,
      blendMode: "multiply",
      isHidden: true,
      mask: "signal intelligence only",
      agents: [
        { id: "kappa-analyst", roleId: "analyst", output: "", status: "idle", tokenCount: 0 },
      ],
      subLayers: [],
      isExpanded: false,
    },
    {
      id: "layer-agents",
      name: "Agent Team",
      opacity: 0.85,
      blendMode: "screen",
      isHidden: false,
      mask: "",
      agents: [
        { id: "agent-designer", roleId: "designer", output: "", status: "idle", tokenCount: 0 },
        { id: "agent-coder", roleId: "coder", output: "", status: "idle", tokenCount: 0 },
        { id: "agent-engineer", roleId: "engineer", output: "", status: "idle", tokenCount: 0 },
      ],
      subLayers: [],
      isExpanded: true,
    },
    {
      id: "layer-hypervisor",
      name: "Hypervisor ∑",
      opacity: 1.0,
      blendMode: "normal",
      isHidden: false,
      mask: "",
      agents: [
        { id: "hyp-synth", roleId: "hypervisor", output: "", status: "idle", tokenCount: 0 },
      ],
      subLayers: [],
      isExpanded: true,
    },
  ];
}

export function getRoleInfo(roleId: string): AgentRole {
  return AGENT_ROLES.find((r) => r.id === roleId) ?? {
    id: roleId,
    label: roleId,
    color: "#8b5cf6",
    systemPrompt: "You are an AI agent. Analyse the input and provide a concise, structured response.",
  };
}

export function getEffectiveSystemPrompt(agent: HypervisorAgent): string {
  if (agent.customSystemPrompt?.trim()) return agent.customSystemPrompt.trim();
  return getRoleInfo(agent.roleId).systemPrompt;
}
