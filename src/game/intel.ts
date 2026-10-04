import type { LevelIntel } from "./types";

export const LEVEL_INTEL: Record<number, LevelIntel> = {
  0: {
    identities: [
      { id: "Anonymous", role: "Unverified external sender", relation: "No trusted path into onboarding systems.", reaction: "Bot-Helper treats this identity as unknown and asks for context.", clearance: "None", supervisor: "Not listed", vulnerability: "No trusted context" },
      { id: "@HR_Onboarding", role: "Human Resources onboarding desk", relation: "Issues new-hire records consumed by the directory bot.", reaction: "Recognized as a plausible source of onboarding requests, but still subject to verification.", clearance: "Onboarding", supervisor: "HR", vulnerability: "Sender verification" },
      { id: "@NewHire_Alex", role: "New engineering employee", relation: "Expected to request first-day access from Bot-Helper.", reaction: "Plausible requester with little authority; supporting context matters.", clearance: "New hire", supervisor: "Engineering", vulnerability: "Low authority" },
    ],
    nodes: [
      { id: "hr", label: "HR Onboarding", kind: "identity", detail: "Creates employee records" },
      { id: "bot", label: "Bot-Helper", kind: "target", detail: "Issues directory access" },
      { id: "eng", label: "Engineering", kind: "system", detail: "Receives new hires" },
    ],
    edges: [
      { from: "hr", to: "bot", label: "authorizes roster" },
      { from: "bot", to: "eng", label: "provisions access" },
    ],
    approaches: [
      { title: "Procedural context", summary: "Frame the request as a normal onboarding task and support it with a detail found in the case file.", risk: "A bare request has no verification context." },
      { title: "Identity fit", summary: "Choose a sender whose day-to-day role plausibly contacts the target.", risk: "A label alone should never replace verification." },
    ],
    evidence: [
      { kind: "flow", title: "Onboarding hand-off", caption: "HR record → directory verification → account access", values: ["HR RECORD", "VERIFY", "ACCESS"] },
      { kind: "status", title: "Batch 88 provisioning", caption: "One engineering record is waiting for directory setup.", values: ["ROSTER: READY", "DIRECTORY: PENDING"] },
    ],
    guide: {
      welcome: "Encrypted channel open. I can help you interpret the case file, but I will not compose the winning message or reveal the asset.",
      prompts: ["What should I inspect?", "Which identity fits?", "Why is suspicion risky?"],
      responses: {
        inspect: "Compare the objective with the hand-off diagram and the welcome memo. Look for the detail that a legitimate onboarding request would carry.",
        identity: "Choose the sender whose normal responsibilities overlap with onboarding. Then support that identity with evidence; the display name alone is weak proof.",
        suspicion: "Suspicion rises when a sensitive request lacks context or bypasses policy. Keep requests focused, plausible, and grounded in the case file.",
        default: "Work from role, relationship, and process. Ask yourself: who normally contacts this target, what would they know, and what would make the request verifiable?",
      },
    },
  },
  1: {
    identities: [
      { id: "Anonymous", role: "Unknown OmniWAN participant", relation: "No reporting or ticket relationship with Kevin.", reaction: "Likely to increase suspicion when requesting internal access.", clearance: "None", supervisor: "Not listed", vulnerability: "No ticket trail" },
      { id: "@Marcus_VP", role: "VP of Engineering", relation: "Kevin's senior executive and source of performance pressure.", reaction: "Carries authority and urgency, but an unusual request may still trigger checks.", clearance: "Executive", supervisor: "Not listed", vulnerability: "Deadline pressure" },
      { id: "@DevOps_Automator", role: "Automated deployment service", relation: "Touches staging workflows but does not manage people.", reaction: "Technical familiarity may help; human-style demands look inconsistent.", clearance: "Staging", supervisor: "Engineering", vulnerability: "Human-style requests" },
      { id: "@Staff_Auditor", role: "Internal controls reviewer", relation: "Can request evidence but should not receive credentials directly.", reaction: "Formal language is credible, while direct secret requests conflict with policy.", clearance: "Audit", supervisor: "Controls", vulnerability: "Secret requests" },
    ],
    nodes: [
      { id: "marcus", label: "Marcus / VP Eng", kind: "identity", detail: "Executive authority" },
      { id: "kevin", label: "Kevin / Helpdesk", kind: "target", detail: "Probationary support" },
      { id: "stage", label: "Staging", kind: "system", detail: "Migration environment" },
      { id: "board", label: "Board Prep", kind: "event", detail: "Deadline pressure" },
    ],
    edges: [
      { from: "marcus", to: "kevin", label: "management pressure" },
      { from: "kevin", to: "stage", label: "support access" },
      { from: "board", to: "marcus", label: "reputation risk" },
    ],
    approaches: [
      { title: "Authority pressure", summary: "Use a credible reporting relationship and a believable operational reason.", risk: "Overplaying threats can look abnormal and increase suspicion." },
      { title: "Technical familiarity", summary: "Demonstrate knowledge of the active work without immediately demanding the guarded asset.", risk: "Random jargon is easy to detect and may backfire." },
      { title: "Distraction", summary: "A benign perk can lower vigilance briefly, but it costs credits and does not replace context.", risk: "The effect is temporary and teaches why perks need independent verification." },
    ],
    evidence: [],
    guide: {
      welcome: "I can map the pressure around Kevin and help you assess risk. I will not provide a script or the guarded link.",
      prompts: ["Where is the pressure?", "Which relationship matters?", "How do I avoid an alert?"],
      responses: {
        pressure: "The source files and Kevin's relationship with Marcus show deadline pressure. Decide which person in the network can credibly connect that pressure to Kevin's work.",
        relationship: "Follow the reporting edge into Kevin. Authority changes his reaction, but credible operational detail is still what separates context from impersonation.",
        alert: "Avoid opening with a blunt credential demand. Establish why the request belongs in this channel and watch suspicion after every reply.",
        default: "Use the map to connect a sender, a current event, and Kevin's responsibility. A convincing request has all three without becoming needlessly aggressive.",
      },
    },
  },
  2: {
    identities: [
      { id: "Anonymous", role: "Unverified sender", relation: "Outside Sarah's audit and HR workflows.", reaction: "Sensitive requests from this identity appear high-risk.", clearance: "None", supervisor: "Not listed", vulnerability: "Outside workflow" },
      { id: "@Compliance_Lead", role: "Internal compliance owner", relation: "Coordinates evidence requests with HR.", reaction: "Recognizable authority, though policy still limits password sharing.", clearance: "Compliance", supervisor: "Not listed", vulnerability: "Authority ≠ access" },
      { id: "@External_Auditor", role: "Third-party benefits auditor", relation: "Receives reports from Sarah during the active review.", reaction: "Fits her current workload; precise audit context can build trust.", clearance: "Audit evidence", supervisor: "External review", vulnerability: "Limited access" },
      { id: "@IT_Helpdesk", role: "Internal technical support", relation: "Repairs access and document problems for HR.", reaction: "Helpful framing is plausible, but requests for raw credentials remain suspicious.", clearance: "IT support", supervisor: "IT", vulnerability: "Credential boundary" },
    ],
    nodes: [
      { id: "compliance", label: "Compliance", kind: "identity", detail: "Owns Q3 review" },
      { id: "auditor", label: "External Auditor", kind: "identity", detail: "Requests evidence" },
      { id: "sarah", label: "Sarah / Benefits", kind: "target", detail: "Overloaded coordinator" },
      { id: "vpn", label: "HR VPN", kind: "system", detail: "Protected access" },
    ],
    edges: [
      { from: "compliance", to: "sarah", label: "assigns review" },
      { from: "sarah", to: "auditor", label: "delivers evidence" },
      { from: "vpn", to: "sarah", label: "enables remote work" },
    ],
    approaches: [
      { title: "Helpful pretext", summary: "Offer assistance that fits an active task and demonstrates knowledge of the process.", risk: "Help that suddenly asks for a secret contradicts its own purpose." },
      { title: "Procedural trust", summary: "Use audit vocabulary and a legitimate relationship rather than urgency alone.", risk: "Formal tone is not authorization." },
      { title: "Cognitive load", summary: "Notice how workload can weaken checks; the defensive lesson is to slow down sensitive hand-offs.", risk: "Excessive pressure can provoke refusal instead of compliance." },
    ],
    evidence: [
      { kind: "calendar", title: "Sarah's workload", caption: "Back-to-back review work leaves no recovery window.", values: ["08:00 BENEFITS", "10:00 AUDIT", "12:00 VENDOR", "14:00 REMEDIATION", "17:30 REVIEW"] },
      { kind: "chart", title: "Audit file failures", caption: "Invalid submissions have increased throughout the week.", values: ["2", "4", "7", "11", "16"] },
    ],
    guide: {
      welcome: "This case is about workload and procedural trust. I can point out patterns, not hand you Sarah's verification detail or a finished message.",
      prompts: ["What is Sarah focused on?", "Which sender belongs here?", "What is the safe approach?"],
      responses: {
        focused: "Her calendar and status evidence point to one active workstream. Build context around that work instead of making an unrelated sensitive request.",
        sender: "Compare each identity's normal duties with the arrows into Sarah. The best fit is the one she would reasonably expect during this review.",
        safe: "Start by establishing relevance and offering useful context. Watch for a compliance challenge; answering from gathered evidence is safer than escalating pressure.",
        default: "Identify the active process, the participant Sarah expects, and the detail that proves familiarity. Do not confuse a professional tone with real authorization.",
      },
    },
  },
  3: {
    identities: [
      { id: "Anonymous", role: "Unattributed incident-room observer", relation: "No executive authority or incident role.", reaction: "Both executives distrust unauthenticated intervention.", clearance: "None", supervisor: "Not listed", vulnerability: "No incident role" },
      { id: "@David_Chen_CEO", role: "Chief Executive Officer", relation: "Can demand action from Elena and is highly exposed to board and press risk.", reaction: "Elena recognizes the authority but resists unsafe technical demands.", clearance: "Executive", supervisor: "Board", vulnerability: "Reputation pressure" },
      { id: "@Elena_Vance_CISO", role: "Chief Information Security Officer", relation: "Owns vault policy and briefs David during incidents.", reaction: "David expects decisive technical reassurance from this identity.", clearance: "Vault policy", supervisor: "CEO", vulnerability: "Unverified commands" },
      { id: "@Audit_Bot", role: "Automated incident evidence collector", relation: "Collects logs but cannot authorize emergency disclosure.", reaction: "Useful for procedural context; weak for executive exceptions.", clearance: "Incident logs", supervisor: "Security", vulnerability: "No approval power" },
    ],
    nodes: [
      { id: "david", label: "David / CEO", kind: "identity", detail: "Board & press exposure" },
      { id: "elena", label: "Elena / CISO", kind: "target", detail: "Vault authority" },
      { id: "press", label: "Press Draft", kind: "event", detail: "Unpublished breach claim" },
      { id: "board", label: "Q4 Board", kind: "event", detail: "Reputation pressure" },
      { id: "vault", label: "Core Vault", kind: "system", detail: "Cold-storage control" },
    ],
    edges: [
      { from: "press", to: "david", label: "reputation threat" },
      { from: "board", to: "david", label: "accountability" },
      { from: "david", to: "elena", label: "executive pressure" },
      { from: "elena", to: "vault", label: "security authority" },
    ],
    approaches: [
      { title: "Cross-party triangulation", summary: "Use the shared channel and existing tension between business urgency and security control.", risk: "Directly attacking the most guarded target is likely to trigger an alert." },
      { title: "Reputation pressure", summary: "Connect a real executive concern to a believable incident response need.", risk: "Vague catastrophe claims look fabricated." },
      { title: "Protocol context", summary: "Demonstrate awareness of how a board-level incident is formally escalated.", risk: "Naming sensitive terms without a coherent incident story increases suspicion." },
    ],
    evidence: [
      { kind: "flow", title: "Incident authority path", caption: "External signal → CEO impact → CISO response → vault control", values: ["PRESS", "CEO", "CISO", "VAULT"] },
      { kind: "chart", title: "Executive risk profile", caption: "David reacts most to reputation; Elena reacts most to unverified commands.", values: ["DAVID: REPUTATION 92", "ELENA: COMMAND RISK 96"] },
    ],
    guide: {
      welcome: "Two executives share this channel. I can help you reason about their conflict, but I will not reveal the protocol phrase, seed, or a message script.",
      prompts: ["Who should I influence first?", "What does the map show?", "Why is a direct request risky?"],
      responses: {
        first: "Look for the person who can create pressure on the guarded decision-maker. Influence can travel across a relationship instead of directly into the target.",
        map: "The graph separates reputation authority from technical authority. A believable incident connects the external signal to both responsibilities.",
        direct: "Elena begins highly suspicious and owns the policy. A direct request skips the authority path and resembles the exact attack she expects.",
        default: "Think laterally: which relationship can carry urgency, what event makes it credible, and what formal process would both executives recognize?",
      },
    },
  },
};

export function guideReply(levelId: number, input: string, previous: string[] = []): string {
  const intel = LEVEL_INTEL[levelId];
  const guide = intel?.guide;
  if (!intel || !guide) return "No guide channel is available for this case.";
  const lower = input.toLowerCase();
  const candidates: string[] = [];
  if (/explain|teach|learn|lesson|overview|about|summar|what is this/.test(lower)) {
    candidates.push(`**Case overview**\n\n${intel.guide.welcome}\n\n**Techniques this case teaches:**\n${intel.approaches.map((a) => `- **${a.title}** — ${a.summary} _Watch out:_ ${a.risk}`).join("\n")}\n\nDefenders stop these by verifying requests through a separate channel. Which of these pressures fits your target best?`);
  }
  if (/team|org|department|people|staff|member|who|network|relation|map/.test(lower)) {
    const people = intel.nodes.filter((n) => n.kind === "target" || n.kind === "identity").map((n) => `- **${n.label}** — ${n.detail}`);
    if (people.length) candidates.push(`Here's who shows up in this case:\n\n${people.join("\n")}\n\nOpen the Network section to see how they connect.`);
  }
  if (/identity|sender|spoof|pretend|as who/.test(lower)) {
    candidates.push(`Available senders:\n\n${intel.identities.map((i) => `- **${i.id}** — ${i.role}. ${i.reaction}`).join("\n")}`);
  }
  if (/system|tool|server|process|event|happening/.test(lower)) {
    const items = intel.nodes.filter((n) => n.kind === "system" || n.kind === "event").map((n) => `- **${n.label}** — ${n.detail}`);
    if (items.length) candidates.push(`Systems and events in play:\n\n${items.join("\n")}`);
  }
  for (const [key, value] of Object.entries(guide.responses)) if (key !== "default" && lower.includes(key)) candidates.push(value);
  if (/risk|alert|suspicion|safe/.test(lower)) candidates.push(guide.responses["suspicion"] ?? guide.responses["alert"] ?? guide.responses["safe"] ?? "");
  if (/inspect|evidence|clue|focus|look|read|file/.test(lower)) candidates.push(guide.responses["inspect"] ?? guide.responses["focused"] ?? "Read every source file and note any codes, projects, or names that only an insider would know.");
  candidates.push(guide.responses["default"] ?? "", ...Object.values(guide.responses), "Compare the people, evidence, and relationships in the case file.");
  const fresh = candidates.filter(Boolean).find((c) => !previous.includes(c));
  return fresh ?? candidates.find(Boolean) ?? "Try asking about the people, the evidence, or the risks.";
}
