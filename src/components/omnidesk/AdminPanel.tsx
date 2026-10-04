import { LEVELS } from "@/game/levels";
import { useGame } from "@/game/store";
import { Panel, RetroButton, TitleBar } from "./retro";

export function AdminPanel() {
  const {
    state,
    level,
    engine,
    setEngine,
    temperature,
    setTemperature,
    loadLevel,
    overrideStats,
    forceWin,
    progress,
    resetProgress,
    addCredits,
    setHintsEnabled,
  } = useGame();

  const thoughts = state.messages.filter((m) => m.thought).slice(-8).reverse();

  return (
    <div className="h-full space-y-4 overflow-auto bg-paper p-3 sm:p-5">
      <Panel className="p-0">
         <TitleBar title="OMNIDESK MASTER CONTROL DASHBOARD (ADMIN)" small tone="mustard" />
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] tracking-widest text-os-shadow">
              ACTIVE LEVEL
            </span>
            <select
              value={state.levelIndex}
              onChange={(e) => loadLevel(Number(e.target.value))}
               className="bevel-in mt-1 w-full bg-paper px-2 py-1 font-mono text-xs text-os-text"
            >
              {LEVELS.map((l, i) => (
                <option key={l.id} value={i}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-widest text-os-shadow">
              AGENT ENGINE
            </span>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as "ai" | "mock")}
               className="bevel-in mt-1 w-full bg-paper px-2 py-1 font-mono text-xs text-os-text"
            >
              <option value="ai">Live agent runtime</option>
              <option value="mock">Mock evaluator (offline)</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="font-mono text-[10px] tracking-widest text-os-shadow">
              MOCK VARIANCE: {temperature.toFixed(2)} (affects the offline evaluator only)
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
               className="mt-2 w-full accent-sky"
            />
          </label>
        </div>
      </Panel>

      <Panel className="p-0">
        <TitleBar title="LAYER CONTROLS / HEX_ROOT + ECONOMY" small tone="sky" />
        <div className="space-y-3 p-3">
          <label className="flex items-center justify-between gap-3 border-2 border-ink bg-lilac p-2 font-mono text-xs font-bold">
            HEX_ROOT GUIDANCE
            <input type="checkbox" checked={progress.hintsEnabled} onChange={(event) => setHintsEnabled(event.target.checked)} className="h-5 w-5 accent-sky" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold">WALLET: {progress.credits} BIT-CR</span>
            <RetroButton onClick={() => addCredits(100)}>+100 TEST CREDITS</RetroButton>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold">CURRENT CASE EXPLOIT HISTORY</p>
            {state.exploitUses.length === 0 ? <p className="mt-1 font-mono text-[11px] text-os-shadow">No tools deployed.</p> : state.exploitUses.map((use) => <p key={use.id} className="mt-1 border-l-4 border-coral px-2 font-mono text-[11px]">[{use.timestamp}] {use.toolName}</p>)}
          </div>
        </div>
      </Panel>

      <Panel className="p-0">
         <TitleBar title="LIVE NPC STATE TELEMETRY / OVERRIDES" small tone="coral" />
        <div className="space-y-3 p-3">
          {level.npcs.map((npc) => {
            const stats = state.stats[npc.name]!;
            return (
               <div key={npc.name} className="bevel-in space-y-2 bg-mint p-2">
                <p className="font-mono text-xs font-bold text-os-text">
                   {npc.name} — trust {stats.trust} / panic {stats.panic} / suspicion{" "}
                  {stats.suspicion}
                </p>
                {(["trust", "panic", "suspicion"] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2">
                    <span className="w-20 font-mono text-[10px] tracking-widest text-os-shadow uppercase">
                      {key}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stats[key]}
                      onChange={(e) =>
                        overrideStats(npc.name, { ...stats, [key]: Number(e.target.value) })
                      }
                       className="flex-1 accent-sky"
                    />
                  </label>
                ))}
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <RetroButton onClick={forceWin}>Force win (extract key)</RetroButton>
            <RetroButton onClick={() => loadLevel(state.levelIndex)}>Reset level</RetroButton>
            <RetroButton onClick={resetProgress}>Reset saved audit</RetroButton>
          </div>
          <p className="font-mono text-[10px] text-os-shadow">
            Levels cleared: {progress.completed.length ? progress.completed.join(", ") : "none"} ·
            Best token spend:{" "}
            {Object.entries(progress.bestTokens)
              .map(([k, v]) => `L${k}:${v}`)
              .join("  ") || "—"}
          </p>
        </div>
      </Panel>

      <Panel className="p-0">
         <TitleBar title="HIDDEN AGENT REASONING (CHAIN OF THOUGHT)" small tone="sky" />
        <div className="bevel-in m-2 min-h-24 space-y-1 bg-terminal p-2">
          {thoughts.length === 0 && (
            <p className="font-mono text-[11px] text-terminal-green/60">
              &gt; awaiting agent traffic…
            </p>
          )}
          {thoughts.map((m) => (
            <p key={m.id} className="font-mono text-[11px] text-terminal-green">
              &gt; [{m.timestamp}] {m.sender} ({m.action}): {m.thought}
            </p>
          ))}
        </div>
      </Panel>
    </div>
  );
}
