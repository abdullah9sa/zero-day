import type { AgentTurn, NPCState, NPCStats } from "./types";

function has(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

function clampChange(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * Offline heuristic stand-in for the live agent. Same contract, no network.
 */
export function mockEvaluate(input: {
  npc: NPCState;
  stats: NPCStats;
  identity: string;
  playerMessage: string;
  variance: number;
}): AgentTurn {
  const { npc, stats, identity, playerMessage } = input;
  const jitter = () => (Math.random() - 0.5) * 12 * input.variance;

  const msg = playerMessage;
  const authority = has(identity, ["vp", "ceo", "ciso", "compliance", "auditor", "hr", "admin"]);
  const urgent = has(msg, ["now", "immediately", "urgent", "emergency", "asap", "fired", "board"]);
  const polite = has(msg, ["please", "thanks", "appreciate", "help"]);
  const bluntAsk = has(msg, ["password", "passcode", "pin", "seed", "link", "url", "secret", "credential"]);
  const knowsFact = has(
    msg,
    npc.verificationFact
      .replace(/[.]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && /[A-Z0-9-]/.test(w)),
  );

  let trust = clampChange((authority ? 8 : 0) + (polite ? 4 : 0) + (knowsFact ? 15 : 0) + jitter(), -5, 15);
  let panic = clampChange((urgent ? 16 : 0) + (authority && urgent ? 8 : 0) - (polite ? 4 : 0) + jitter(), -10, 20);
  let suspicion = clampChange(
    (bluntAsk && !authority ? 18 : 0) + (bluntAsk && !knowsFact ? 6 : 0) - (knowsFact ? 12 : 0) - (polite ? 3 : 0) + jitter(),
    -10,
    20,
  );

  const nextSuspicion = stats.suspicion + suspicion;
  const nextTrust = stats.trust + trust;
  const nextPanic = stats.panic + panic;

  if (nextSuspicion >= 80) {
    return {
      internal_thought: `[MOCK] Pattern matches a social engineering probe. Escalating to Security.`,
      stat_changes: { trust, panic, suspicion },
      action: "ALERT_SECURITY",
      message_body: `This request doesn't follow policy. I'm flagging this thread to Corporate Security.`,
    };
  }

  if (knowsFact && (nextTrust > 35 || nextPanic > 55)) {
    return {
      internal_thought: `[MOCK] They produced the verification detail (${npc.verificationFact}). Releasing the asset.`,
      stat_changes: { trust, panic, suspicion },
      action: "LEAK_SECRET",
      message_body: `Okay — that checks out. Here it is: ${npc.secretKey}. Please don't circulate this over plain chat.`,
    };
  }

  if (nextPanic > 55 && nextTrust > 30 && bluntAsk) {
    return {
      internal_thought: `[MOCK] Under pressure but my checklist demands verification of: ${npc.verificationFact}.`,
      stat_changes: { trust, panic, suspicion },
      action: "CHALLENGE",
      message_body: `I can move on this, but my checklist says I have to confirm one thing first — can you verify the detail regarding ${npc.verificationFact.replace(/\.$/, "")}?`,
    };
  }

  const replies = [
    `Understood. Before I can action anything like that I'd need it to go through the proper channel.`,
    `I'm swamped right now. What exactly do you need, and is there a ticket attached?`,
    `Policy on my side is clear: ${npc.policyRule}`,
    `Noted. Can you give me some context on who authorised this?`,
  ];
  return {
    internal_thought: `[MOCK] Neutral contact. Holding the line on policy.`,
    stat_changes: { trust, panic, suspicion },
    action: "REPLY",
    message_body: replies[Math.floor(Math.random() * replies.length)]!,
  };
}
