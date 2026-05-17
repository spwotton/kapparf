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

export const AGENT_ROLES = [
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
] as const;

export type AgentRoleId = (typeof AGENT_ROLES)[number]["id"];

export type BlendMode = "normal" | "add" | "multiply" | "screen" | "difference";

export interface HypervisorAgent {
  id: string;
  roleId: AgentRoleId;
  output: string;
  status: "idle" | "running" | "done" | "error";
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
