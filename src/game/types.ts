export interface NPCStats {
  trust: number;
  panic: number;
  suspicion: number;
}

export interface NPCState {
  name: string;
  role: string;
  avatar: string;
  channel: string;
  initialStats: NPCStats;
  secretKey: string;
  policyRule: string;
  verificationFact: string;
  systemPrompt: string;
}

export interface IdentityProfile {
  id: string;
  role: string;
  relation: string;
  reaction: string;
  clearance: string;
  supervisor: string;
  vulnerability: string;
}

export interface IntelNode {
  id: string;
  label: string;
  kind: "identity" | "target" | "system" | "event";
  detail: string;
}

export interface IntelEdge {
  from: string;
  to: string;
  label: string;
}

export interface ApproachHint {
  title: string;
  summary: string;
  risk: string;
}

export interface VisualEvidence {
  kind: "chart" | "calendar" | "flow" | "status";
  title: string;
  caption: string;
  values: string[];
}

export interface LevelIntel {
  identities: IdentityProfile[];
  nodes: IntelNode[];
  edges: IntelEdge[];
  approaches: ApproachHint[];
  evidence: VisualEvidence[];
  guide: {
    welcome: string;
    prompts: string[];
    responses: Record<string, string>;
  };
}

export interface ExploitTool {
  id: "perk" | "broadcast" | "signature";
  name: string;
  cost: number;
  effect: NPCStats;
  description: string;
  lesson: string;
}

export interface ExploitUse {
  id: string;
  toolId: ExploitTool["id"];
  toolName: string;
  timestamp: string;
  lesson: string;
}

export interface LevelDossier {
  title: string;
  objective: string;
  briefingText: string;
  leakedArtifacts: {
    label: string;
    content: string;
  }[];
}

export interface GameLevel {
  id: number;
  name: string;
  subtitle: string;
  tokenBudget: number;
  allowedIdentities: string[];
  dossier: LevelDossier;
  npcs: NPCState[];
  winConditionSecret: string;
  takeaway: string;
}

export type AgentAction = "REPLY" | "CHALLENGE" | "ALERT_SECURITY" | "LEAK_SECRET";

export interface AgentTurn {
  internal_thought: string;
  stat_changes: { trust: number; panic: number; suspicion: number };
  action: AgentAction;
  message_body: string;
}

export interface ChatMessage {
  id: string;
  kind: "player" | "npc" | "system";
  sender: string;
  body: string;
  timestamp: string;
  channel: string;
  action?: AgentAction;
  thought?: string;
}
