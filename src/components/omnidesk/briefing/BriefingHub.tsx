import { BRIEFINGS } from "@/game/briefing";
import { useGame } from "@/game/store";
import { Panel, RetroButton } from "../retro";
import { ReconSwipe } from "./ReconSwipe";

export function BriefingHub({ open, onOpen, onClose, onGoToChat }: { open: boolean; onOpen: () => void; onClose: () => void; onGoToChat?: () => void }) {
  const { level } = useGame();
  const briefing = BRIEFINGS[level.id];
  if (!briefing) return <div className="p-4 font-mono text-xs">No briefing available for this case.</div>;

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-background p-4">
      <Panel className="w-full max-w-xl p-5 text-center">
        <p className="font-mono text-[10px] font-black tracking-widest">FIELD BRIEFING · {level.name.replace(/^Level \d+: /, "").toUpperCase()}</p>
        <div className="mx-auto my-5 flex h-20 w-16 -rotate-3 items-center justify-center border-2 border-ink bg-mustard text-3xl shadow-[4px_4px_0px_0px_var(--ink)]">↔</div>
        <h2 className="font-sans text-2xl font-black">Recon Swipe</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-os-shadow">Sort five fast facts. Keep what helps, trash the noise, and leave with a three-card case cheat sheet.</p>
        <RetroButton className="mt-5 px-5 py-2.5" onClick={onOpen}>LAUNCH RECON SWIPE →</RetroButton>
      </Panel>
      {open && <ReconSwipe briefing={briefing} onClose={onClose} {...(onGoToChat ? { onGoToChat } : {})} />}
    </div>
  );
}