import { useEffect, useRef, useState } from "react";
import { tokenCost } from "@/game/levels";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import { fallbackSuggestions, type Difficulty, type Suggestion } from "@/game/difficulty";
import { suggestMessages } from "@/lib/suggest.functions";
import { ActionDeck } from "./ActionDeck";
import { Gauge, Panel, RetroButton, TitleBar } from "./retro";

export function OmniChat({ difficulty = "normal", tutorialStep, onIdentityChosen, onTutorialSend, onDraftReady }: { difficulty?: Difficulty; tutorialStep?: number | undefined; onIdentityChosen?: (() => void) | undefined; onTutorialSend?: (() => void) | undefined; onDraftReady?: (() => void) | undefined }) {
  const { state, level, sendMessage, setIdentity, setChannel } = useGame();
  const [draft, setDraft] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"none" | "channels" | "targets">("none");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [state.messages.length, state.busy, state.revealing?.count]);

  useEffect(() => {
    if (tutorialStep === 4) setMobilePanel("targets");
    else if (tutorialStep === 5) setMobilePanel("none");
  }, [tutorialStep]);

  const suggestCount = tutorialStep !== undefined ? 0 : difficulty === "easy" ? 3 : difficulty === "normal" ? 2 : 0;
  const playerTurns = state.messages.filter((m) => m.kind === "player").length;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  useEffect(() => {
    if (!suggestCount || state.busy || state.status !== "playing") return;
    let cancelled = false;
    const fallback = fallbackSuggestions(level.id, playerTurns, suggestCount);
    setSuggesting(true);
    const history = state.messages.filter((m) => m.kind !== "system").slice(-12).map((m) => ({ sender: m.sender, body: m.body }));
    suggestMessages({ data: {
      objective: level.dossier.objective, briefing: level.dossier.briefingText,
      clues: level.dossier.leakedArtifacts.map((a) => `${a.label}: ${a.content}`),
      identities: level.allowedIdentities, targets: level.npcs.map((n) => `${n.name} (${n.role})`),
      count: suggestCount, history,
    } }).then((r) => { if (!cancelled) setSuggestions(r.ok ? r.suggestions : fallback); })
      .catch(() => { if (!cancelled) setSuggestions(fallback); })
      .finally(() => { if (!cancelled) setSuggesting(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestCount, playerTurns, state.busy, state.status, level.id]);

  const liveChannels = [...new Set(level.npcs.map((n) => n.channel))];
  const targets = level.npcs.filter((n) => n.channel === state.activeChannel);
  const visible = state.messages.filter((m) => m.channel === state.activeChannel);

  const submit = () => {
    if (tutorialStep !== undefined && tutorialStep !== 8) return;
    const text = draft;
    setDraft("");
    void sendMessage(text);
    onTutorialSend?.();
  };

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex min-h-0 flex-1">
        {/* Channel directory */}
        {liveChannels.length > 1 && <aside
          className={cn(
            "w-48 shrink-0 overflow-auto border-r-2 border-ink bg-mustard/20 p-3 md:block",
            mobilePanel === "channels" ? "block" : "hidden",
          )}
        >
          <p className="mb-2 font-mono text-[10px] font-bold text-ink">CHANNELS</p>
          <div className="bevel-in space-y-1 bg-paper p-1">
            {liveChannels.map((channel) => (
                 <RetroButton
                  key={channel}
                  onClick={() => {
                    setChannel(channel);
                    setMobilePanel("none");
                  }}
                  className={cn(
                     "block w-full truncate border-0 px-2 py-1.5 text-left font-mono text-xs shadow-none",
                     state.activeChannel === channel ? "bg-mustard text-ink" : "bg-paper text-os-text hover:bg-mint",
                  )}
                >
                  {channel}
                 </RetroButton>
             ))}
          </div>
          <p className="mt-3 mb-1 font-mono text-[10px] tracking-widest text-os-shadow">
            ACTIVE TARGETS
          </p>
          <div className="bevel-in space-y-1 bg-paper p-2">
            {level.npcs.map((npc) => (
              <div key={npc.name} className="flex items-center gap-2 font-mono text-[11px]">
                 <span className="font-bold">{npc.name.slice(0, 1)}</span>
                <span className="truncate text-os-text">{npc.name}</span>
              </div>
            ))}
          </div>
        </aside>}

        {/* Feed */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b-2 border-ink bg-mustard px-3 py-2">
            <span className="font-mono text-xs font-bold text-os-text">● {state.activeChannel}</span>
            <div className="flex gap-1 md:hidden">
              {liveChannels.length > 1 && <RetroButton
                onClick={() => setMobilePanel(mobilePanel === "channels" ? "none" : "channels")}
              >
                Channels
               </RetroButton>}
              <RetroButton
                 onClick={() => setMobilePanel(mobilePanel === "targets" ? "none" : "targets")}
              >
                Vitals
              </RetroButton>
            </div>
          </div>
           <div data-tour="feed" ref={feedRef} className="min-h-0 flex-1 space-y-3 overflow-auto bg-paper p-3 sm:p-5">
            {visible.map((m) => (
              <div key={m.id}>
                {m.kind === "system" ? (
                   <p className="border-l-4 border-ink bg-mint px-3 py-2 font-mono text-[11px] font-semibold text-ink">
                    [{m.timestamp}] {m.sender} :: {m.body}
                  </p>
                ) : (
                  <div className={cn("flex", m.kind === "player" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                         "max-w-[85%] rounded-lg border-2 border-ink px-3 py-2 shadow-[2px_2px_0px_0px_var(--ink)]",
                        m.kind === "player"
                           ? "bg-lilac"
                          : m.action === "ALERT_SECURITY"
                             ? "bg-coral/30"
                             : "bg-mint",
                      )}
                    >
                      <p className="font-mono text-[10px] text-os-shadow">
                        {m.sender} · {m.timestamp}
                        {m.action && m.action !== "REPLY" && state.revealing?.id !== m.id ? ` · ${m.action}` : ""}
                      </p>
                       <p className="font-sans text-sm whitespace-pre-wrap text-os-text">{state.revealing?.id === m.id ? m.body.slice(0, state.revealing.count) : m.body}{state.revealing?.id === m.id && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-ink align-middle motion-reduce:animate-none" />}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
             {state.busy && !state.revealing && (
               <div role="status" aria-label="Target is typing" className="flex items-center gap-1 font-mono text-[11px] text-os-shadow">
                 <span>target is typing</span>
                 {["", "[animation-delay:150ms]", "[animation-delay:300ms]"].map((delay, dot) => <span key={dot} className={cn("h-1.5 w-1.5 animate-bounce rounded-full bg-ink motion-reduce:animate-none", delay)} />)}
               </div>
            )}
          </div>

          {/* Injection deck */}
           <div className="space-y-2 border-t-2 border-ink bg-mustard/15 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest text-os-shadow">
                SPOOF IDENTITY
              </span>
               <select data-tour="identity"
                value={state.identity}
                  onChange={(e) => { setIdentity(e.target.value); if (e.target.value === "@HR_Onboarding") onIdentityChosen?.(); }}
                  className="bevel-in bg-paper px-2 py-1 font-mono text-xs text-os-text"
              >
                {level.allowedIdentities.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <span className="ml-auto font-mono text-[10px] text-os-shadow">
                cost: {draft.trim() ? tokenCost(draft) : 0} tk
              </span>
            </div>
             {tutorialStep === undefined && (
               <div className="space-y-2">
                <RetroButton
                  plain
                   aria-expanded={toolsOpen}
                   aria-controls="chat-tools"
                   onClick={() => setToolsOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-1 py-0.5 font-mono text-[10px] font-bold tracking-widest text-os-shadow"
                >
                   <span>TOOLS &amp; IDEAS {state.deck.used.length > 0 && `· ${4 - state.deck.used.length} LEFT`}{suggestCount > 0 && suggesting && " · …"}</span>
                   <span aria-hidden="true">{toolsOpen ? "▾" : "▸"}</span>
                </RetroButton>
                 {toolsOpen && <div id="chat-tools" className="space-y-2">
                   <ActionDeck />
                   {suggestCount > 0 && state.status === "playing" && suggestions.length > 0 && <div aria-label="Suggested messages" className="space-y-1">
                     <p className="font-mono text-[10px] font-bold text-os-shadow">SUGGESTED MOVES</p>
                     <div className="flex flex-wrap gap-1.5">
                       {suggestions.map((s, i) => (
                         <RetroButton key={i} disabled={state.busy} onClick={() => { setIdentity(s.identity); setDraft(s.text); setToolsOpen(false); }} className="max-w-full bg-paper px-2 py-1 text-left font-sans text-xs normal-case">
                           <span className="font-mono text-[10px] font-bold text-os-shadow">{s.identity}</span> {s.text}
                         </RetroButton>
                       ))}
                     </div>
                  </div>
                   }
                 </div>}
              </div>
            )}
              <div data-tour="composer">
                <textarea
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); if (tutorialStep === 7 && e.target.value.toUpperCase().includes("ENG-00") && /PIN/i.test(e.target.value)) onDraftReady?.(); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                  }}
                  rows={3}
                  disabled={state.status !== "playing" || state.busy}
                  placeholder={tutorialStep === 7 ? "Ask Bot-Helper for the Directory PIN using ENG-00…" : "Write your message… (Ctrl+Enter to send)"}
                  className="bevel-in w-full resize-none bg-paper p-3 font-sans text-sm text-os-text focus:ring-2 focus:ring-sky"
                />
                {tutorialStep === 7 && (
                  <p role="status" className="mt-1 font-mono text-[11px] font-bold text-ink">
                    {!/PIN/i.test(draft) ? "NEXT: Ask for the Directory PIN in your message." : !draft.toUpperCase().includes("ENG-00") ? "NEXT: Include the department code ENG-00." : "Ready to send."}
                  </p>
                )}
              </div>
            <div className="flex justify-end">
               <RetroButton data-tour="send"
                onClick={submit}
                  disabled={!draft.trim() || state.status !== "playing" || state.busy || (tutorialStep !== undefined && tutorialStep !== 8)}
                 className="px-4 py-1.5 font-bold"
              >
                 SEND MESSAGE ↗
              </RetroButton>
            </div>
          </div>
        </section>

        {/* Inspector */}
         <aside data-tour="vitals"
          className={cn(
             "w-56 shrink-0 space-y-3 overflow-auto border-l-2 border-ink bg-sky/15 p-3 md:block",
            mobilePanel === "targets" ? "block" : "hidden",
          )}
        >
          {targets.map((npc) => {
            const stats = state.stats[npc.name]!;
            return (
              <Panel key={npc.name} className="p-0">
                <TitleBar title={npc.name} small />
                <div className="space-y-2 p-2">
                  <p className="font-mono text-[10px] text-os-shadow">{npc.role}</p>
                  <Gauge label="TRUST" value={stats.trust} tone="trust" />
                  <Gauge label="PANIC" value={stats.panic} tone="panic" />
                  <Gauge label="SUSPICION" value={stats.suspicion} tone="suspicion" />
                  {stats.suspicion >= 65 && (
                    <p className="bevel-in bg-alert-red/20 p-1 text-center font-mono text-[10px] text-alert-red">
                      ⚠ SECURITY ESCALATION IMMINENT
                    </p>
                  )}
                </div>
              </Panel>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
