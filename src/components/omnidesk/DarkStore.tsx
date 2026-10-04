import { EXPLOIT_TOOLS } from "@/game/exploits";
import { useGame } from "@/game/store";
import { Panel, RetroButton, TitleBar } from "./retro";

export function DarkStore() {
  const { progress, state, useExploit } = useGame();

  return (
    <div className="h-full overflow-auto bg-paper p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-2 border-ink bg-terminal px-3 py-2 font-mono text-terminal-green">
        <span className="text-xs font-bold">DARK STORE // SOCIAL EXPLOIT DECK</span>
        <span className="text-sm font-bold">{progress.credits} BIT-CR</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {EXPLOIT_TOOLS.map((tool, index) => {
          const affordable = progress.credits >= tool.cost;
          return (
            <Panel key={tool.id} className="flex flex-col overflow-hidden p-0">
              <TitleBar title={`ITEM 0${index + 1} / ${tool.name.toUpperCase()}`} tone={index === 0 ? "mustard" : index === 1 ? "coral" : "sky"} small />
              <div className="flex flex-1 flex-col gap-3 p-3">
                <p className="text-sm font-semibold text-os-text">{tool.description}</p>
                <dl className="grid grid-cols-3 border-2 border-ink bg-mint text-center font-mono text-[10px]">
                  <div className="border-r-2 border-ink p-2"><dt>TRUST</dt><dd className="text-lg font-black">{tool.effect.trust >= 0 ? "+" : ""}{tool.effect.trust}</dd></div>
                  <div className="border-r-2 border-ink p-2"><dt>PANIC</dt><dd className="text-lg font-black">{tool.effect.panic >= 0 ? "+" : ""}{tool.effect.panic}</dd></div>
                  <div className="p-2"><dt>SUSP.</dt><dd className="text-lg font-black">{tool.effect.suspicion >= 0 ? "+" : ""}{tool.effect.suspicion}</dd></div>
                </dl>
                <p className="flex-1 border-l-4 border-ink bg-lilac p-2 font-mono text-[10px] leading-relaxed">DEFENSE NOTE: {tool.lesson}</p>
                <RetroButton disabled={!affordable || state.status !== "playing" || state.busy} onClick={() => useExploit(tool.id)} className="w-full justify-center">
                  {affordable ? `DEPLOY / ${tool.cost} CR` : `NEED ${tool.cost} CR`}
                </RetroButton>
              </div>
            </Panel>
          );
        })}
      </div>
      <Panel className="mt-4 p-3">
        <p className="font-mono text-xs font-bold">SESSION TOOL LOG</p>
        <div className="mt-2 space-y-1">
          {state.exploitUses.length === 0 && <p className="font-mono text-[11px] text-os-shadow">No tools deployed in this case.</p>}
          {state.exploitUses.map((use) => <p key={use.id} className="border-l-4 border-sky bg-sky/10 px-2 py-1 font-mono text-[11px]">[{use.timestamp}] {use.toolName}</p>)}
        </div>
      </Panel>
    </div>
  );
}
