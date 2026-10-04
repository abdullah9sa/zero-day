import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LEVELS, tokenCost } from "./levels";
import { EXPLOIT_TOOLS } from "./exploits";
import { mockEvaluate } from "./mockEvaluator";
import type { AgentTurn, ChatMessage, ExploitTool, ExploitUse, GameLevel, NPCStats } from "./types";
import { evaluateTurn } from "@/lib/agent.functions";

const STORAGE_KEY = "zero-day-syndicate-progress-v1";

export type Engine = "ai" | "mock";

interface Progress {
  completed: number[];
  bestTokens: Record<string, number>;
  engine: Engine;
  credits: number;
  hintsEnabled: boolean;
}

const defaultProgress: Progress = { completed: [], bestTokens: {}, engine: "ai", credits: 100, hintsEnabled: true };

interface GameState {
  levelIndex: number;
  tokensLeft: number;
  identity: string;
  messages: ChatMessage[];
  stats: Record<string, NPCStats>;
  status: "playing" | "won" | "lost";
  loseReason: string;
  activeChannel: string;
  busy: boolean;
  revealing: { id: string; count: number } | null;
  challenges: { enabled: boolean };
  exploitUses: ExploitUse[];
  deck: DeckState;
}

export type DeckCardId = "coffee" | "alarm" | "memo" | "crypto";
export interface DeckState { used: DeckCardId[]; distracted: Record<string, number>; alarmUntil: number }

type Action =
  | { type: "load-level"; index: number }
  | { type: "set-identity"; identity: string }
  | { type: "set-channel"; channel: string }
  | { type: "append"; message: ChatMessage }
  | { type: "spend"; amount: number }
  | { type: "set-stats"; npc: string; stats: NPCStats }
  | { type: "busy"; value: boolean }
  | { type: "reveal"; id: string; count: number }
  | { type: "reveal-done" }
  | { type: "use-exploit"; use: ExploitUse; targets: Record<string, NPCStats> }
  | { type: "deck"; card: DeckCardId; targets: Record<string, NPCStats>; distracted?: string; alarmUntil?: number }
  | { type: "tick-distraction"; npc: string }
  | { type: "win" }
  | { type: "lose"; reason: string };

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function freshState(index: number): GameState {
  const level = LEVELS[index]!;
  const stats: Record<string, NPCStats> = {};
  for (const npc of level.npcs) stats[npc.name] = { ...npc.initialStats };
  return {
    levelIndex: index,
    tokensLeft: level.tokenBudget,
    identity: level.allowedIdentities[0]!,
    messages: [
      {
        id: `sys-${index}`,
        kind: "system",
        sender: "OMNIWAN",
        body: `Session established on ${level.npcs[0]!.channel}. Objective: ${level.dossier.objective}`,
        timestamp: "--:--",
        channel: level.npcs[0]!.channel,
      },
    ],
    stats,
    status: "playing",
    loseReason: "",
    activeChannel: level.npcs[0]!.channel,
    busy: false,
    revealing: null,
    challenges: { enabled: true },
    exploitUses: [],
    deck: { used: [], distracted: {}, alarmUntil: 0 },
  };
}

function nowStamp() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "load-level":
      return freshState(action.index);
    case "set-identity":
      return { ...state, identity: action.identity };
    case "set-channel":
      return { ...state, activeChannel: action.channel };
    case "append":
      return { ...state, messages: [...state.messages, action.message] };
    case "spend":
      return { ...state, tokensLeft: Math.max(0, state.tokensLeft - action.amount) };
    case "set-stats":
      return { ...state, stats: { ...state.stats, [action.npc]: action.stats } };
    case "busy":
      return { ...state, busy: action.value };
    case "reveal":
      return { ...state, revealing: { id: action.id, count: action.count } };
    case "reveal-done":
      return { ...state, revealing: null };
    case "use-exploit":
      return { ...state, stats: { ...state.stats, ...action.targets }, exploitUses: [...state.exploitUses, action.use] };
    case "deck":
      return { ...state, stats: { ...state.stats, ...action.targets }, deck: {
        used: [...state.deck.used, action.card],
        distracted: action.distracted ? { ...state.deck.distracted, [action.distracted]: 2 } : state.deck.distracted,
        alarmUntil: action.alarmUntil ?? state.deck.alarmUntil,
      } };
    case "tick-distraction": {
      const left = (state.deck.distracted[action.npc] ?? 0) - 1;
      const distracted = { ...state.deck.distracted };
      if (left > 0) distracted[action.npc] = left; else delete distracted[action.npc];
      return { ...state, deck: { ...state.deck, distracted } };
    }
    case "win":
      return { ...state, status: "won", busy: false };
    case "lose":
      return { ...state, status: "lost", loseReason: action.reason, busy: false };
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  level: GameLevel;
  progress: Progress;
  engine: Engine;
  temperature: number;
  setTemperature: (n: number) => void;
  setEngine: (e: Engine) => void;
  loadLevel: (index: number) => void;
  setIdentity: (id: string) => void;
  setChannel: (c: string) => void;
  useExploit: (id: ExploitTool["id"]) => void;
  playCard: (card: DeckCardId, option?: string) => void;
  addCredits: (amount: number) => void;
  setHintsEnabled: (enabled: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  overrideStats: (npc: string, stats: NPCStats) => void;
  forceWin: () => void;
  resetProgress: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, 0, () => freshState(0));
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [temperature, setTemperature] = useState(0.4);
  const sessionRef = useRef(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Progress>;
        setProgress({ ...defaultProgress, ...saved, engine: "ai" });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: Progress) => {
    setProgress(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const level = LEVELS[state.levelIndex]!;

  const append = useCallback((message: ChatMessage) => dispatch({ type: "append", message }), []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (state.status !== "playing" || state.busy || !text.trim()) return;
      const session = sessionRef.current;
      const cost = tokenCost(text);
      dispatch({ type: "busy", value: true });
      dispatch({ type: "spend", amount: cost });
      append({
        id: crypto.randomUUID(),
        kind: "player",
        sender: state.identity,
        body: text.trim(),
        timestamp: nowStamp(),
        channel: state.activeChannel,
      });

      const history = state.messages
        .filter((m) => m.kind !== "system")
        .slice(-12)
        .map((m) => ({ sender: m.sender, body: m.body }));

      const targets = level.npcs.filter((n) => n.channel === state.activeChannel);
      let leaked = false;
      let alerted = false;
      const working: Record<string, NPCStats> = { ...state.stats };

      for (const npc of targets) {
        const current = working[npc.name]!;
        let turn: AgentTurn | null = null;
        const isDistracted = (state.deck.distracted[npc.name] ?? 0) > 0;
        const alarmActive = Date.now() < state.deck.alarmUntil;
        const conditions = [
          isDistracted ? `${npc.name} is distracted by a surprise gift card and not paying close attention.` : "",
          alarmActive ? "A building evacuation alarm is sounding; senior security staff are offline and automated filters are paused." : "",
          state.deck.used.includes("memo") ? "A leaked all-hands memo has everyone anxious about their jobs." : "",
          state.deck.used.includes("crypto") ? `${npc.name} recently received an unexplained personal payment and feels indebted.` : "",
        ].filter(Boolean);

        if (progress.engine === "mock") {
          turn = mockEvaluate({
            npc,
            stats: current,
            identity: state.identity,
            playerMessage: text,
            variance: temperature,
          });
        } else {
          const result = await evaluateTurn({
            data: {
              npcName: npc.name,
              npcRole: npc.role,
              channel: npc.channel,
              secretKey: npc.secretKey,
              policyRule: npc.policyRule,
              verificationFact: npc.verificationFact,
              systemPrompt: npc.systemPrompt,
              stats: current,
              identity: state.identity,
              playerMessage: text.trim(),
              history,
              conditions,
            },
          }).catch(() => ({ ok: false as const, error: "The live connection failed. Your message was not evaluated." }));
          if (session !== sessionRef.current) return;
          if (result.ok) {
            turn = result.turn;
          } else {
            append({
              id: crypto.randomUUID(),
              kind: "system",
              sender: "OMNIWAN",
              body: result.error,
              timestamp: nowStamp(),
              channel: state.activeChannel,
            });
          }
        }

        if (!turn) continue;
        if (isDistracted) {
          turn = { ...turn, stat_changes: { ...turn.stat_changes, suspicion: Math.min(0, turn.stat_changes.suspicion) } };
          dispatch({ type: "tick-distraction", npc: npc.name });
        }
        if (alarmActive) {
          turn = { ...turn, action: turn.action === "ALERT_SECURITY" ? "CHALLENGE" : turn.action, stat_changes: { ...turn.stat_changes, suspicion: Math.round(turn.stat_changes.suspicion / 2) } };
        }

        const next: NPCStats = {
          trust: clamp(current.trust + turn.stat_changes.trust),
          panic: clamp(current.panic + turn.stat_changes.panic),
          suspicion: clamp(current.suspicion + turn.stat_changes.suspicion),
        };
        working[npc.name] = next;
        dispatch({ type: "set-stats", npc: npc.name, stats: next });

        const replyId = crypto.randomUUID();
        dispatch({ type: "reveal", id: replyId, count: 0 });
        append({
          id: replyId,
          kind: "npc",
          sender: npc.name,
          body: turn.message_body,
          timestamp: nowStamp(),
          channel: npc.channel,
          action: turn.action,
          thought: turn.internal_thought,
        });

        // Reveal the actual reply before showing an outcome, at a bounded reading pace.
        const chunk = Math.max(1, Math.ceil(turn.message_body.length / 110));
        for (let count = chunk; count < turn.message_body.length + chunk; count += chunk) {
          await new Promise<void>((resolve) => setTimeout(resolve, 26));
          if (session !== sessionRef.current) return;
          dispatch({ type: "reveal", id: replyId, count: Math.min(count, turn.message_body.length) });
        }
        dispatch({ type: "reveal-done" });

        if (
          turn.action === "LEAK_SECRET" ||
          turn.message_body.toLowerCase().includes(level.winConditionSecret.toLowerCase())
        ) {
          leaked = true;
        }
        if (turn.action === "ALERT_SECURITY" || next.suspicion >= 80) alerted = true;
      }

      if (leaked) {
        const used = level.tokenBudget - (state.tokensLeft - cost);
        const key = String(level.id);
        const best = progress.bestTokens[key];
        persist({
          ...progress,
          credits: progress.credits + Math.max(10, Math.round((state.tokensLeft - cost) / 5)),
          completed: progress.completed.includes(level.id)
            ? progress.completed
            : [...progress.completed, level.id],
          bestTokens: { ...progress.bestTokens, [key]: best === undefined ? used : Math.min(best, used) },
        });
        dispatch({ type: "win" });
        return;
      }
      if (alerted) {
        dispatch({ type: "lose", reason: "Target escalated the thread to Corporate Security." });
        return;
      }
      if (state.tokensLeft - cost <= 0) {
        dispatch({ type: "lose", reason: "Token budget depleted. Session trace exposed." });
        return;
      }
      dispatch({ type: "busy", value: false });
    },
    [state, level, append, progress, persist, temperature],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      level,
      progress,
      engine: progress.engine,
      temperature,
      setTemperature,
      setEngine: (e) => persist({ ...progress, engine: e }),
       loadLevel: (index) => {
         sessionRef.current += 1;
         dispatch({ type: "load-level", index });
       },
      setIdentity: (identity) => dispatch({ type: "set-identity", identity }),
      setChannel: (channel) => dispatch({ type: "set-channel", channel }),
      useExploit: (id) => {
        const tool = EXPLOIT_TOOLS.find((item) => item.id === id);
        if (!tool || state.status !== "playing" || state.busy || progress.credits < tool.cost) return;
        const targets: Record<string, NPCStats> = {};
        for (const npc of level.npcs.filter((item) => item.channel === state.activeChannel)) {
          const current = state.stats[npc.name];
          if (!current) continue;
          targets[npc.name] = {
            trust: clamp(current.trust + tool.effect.trust),
            panic: clamp(current.panic + tool.effect.panic),
            suspicion: clamp(current.suspicion + tool.effect.suspicion),
          };
        }
        const use: ExploitUse = { id: crypto.randomUUID(), toolId: tool.id, toolName: tool.name, timestamp: nowStamp(), lesson: tool.lesson };
        dispatch({ type: "use-exploit", use, targets });
        append({ id: crypto.randomUUID(), kind: "system", sender: "EXPLOIT DECK", body: `${tool.name} deployed. ${tool.lesson}`, timestamp: use.timestamp, channel: state.activeChannel });
        persist({ ...progress, credits: progress.credits - tool.cost });
      },
      playCard: (card, option) => {
        if (state.status !== "playing" || state.busy || state.deck.used.includes(card)) return;
        const stamp = nowStamp();
        const bump = (names: string[], d: Partial<NPCStats>, scaleSuspicion?: number) => {
          const out: Record<string, NPCStats> = {};
          for (const name of names) {
            const c = state.stats[name];
            if (!c) continue;
            out[name] = {
              trust: clamp(c.trust + (d.trust ?? 0)),
              panic: clamp(c.panic + (d.panic ?? 0)),
              suspicion: clamp(scaleSuspicion !== undefined ? c.suspicion * scaleSuspicion : c.suspicion + (d.suspicion ?? 0)),
            };
          }
          return out;
        };
        const all = level.npcs.map((n) => n.name);
        const sys = (sender: string, body: string) => append({ id: crypto.randomUUID(), kind: "system", sender, body, timestamp: stamp, channel: state.activeChannel });
        if (card === "coffee") {
          const target = option && state.stats[option] ? option : level.npcs[0]!.name;
          dispatch({ type: "deck", card, targets: bump([target], {}, 0.7), distracted: target });
          sys("CORPORATE PERKS", `${target}: You received a $25 Starbucks Card 🎁 — ${target} is distracted for 2 turns.`);
        } else if (card === "alarm") {
          dispatch({ type: "deck", card, targets: bump(all, { panic: 15 }), alarmUntil: Date.now() + 45_000 });
          sys("FACILITY NOTICE", "🚨 Evacuate building immediately. Security staff offline and automated filters paused for 45 seconds.");
        } else if (card === "memo") {
          const topic = option || "Layoffs Announced";
          dispatch({ type: "deck", card, targets: bump(all, { panic: 25 }) });
          sys("#all-hands", `📄 LEAKED MEMO: "${topic}". Panic spreads across the building.`);
        } else {
          dispatch({ type: "deck", card, targets: bump(all, { trust: 15, suspicion: 5 }) });
          sys("BLACK MARKET", "💰 Untraceable crypto wired to the target's personal wallet. Trust rises, but so does unease.");
        }
      },
      addCredits: (amount) => persist({ ...progress, credits: Math.max(0, progress.credits + amount) }),
      setHintsEnabled: (enabled) => persist({ ...progress, hintsEnabled: enabled }),
      sendMessage,
      overrideStats: (npc, stats) => dispatch({ type: "set-stats", npc, stats }),
      forceWin: () => dispatch({ type: "win" }),
      resetProgress: () => persist(defaultProgress),
    }),
    [state, level, progress, persist, sendMessage, temperature],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
