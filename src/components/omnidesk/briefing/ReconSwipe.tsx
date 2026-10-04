import { useEffect, useRef, useState } from "react";
import type { LevelBriefing, ReconCardKind } from "@/game/briefing";
import { cn } from "@/lib/utils";
import { Panel, RetroButton, TitleBar } from "../retro";

const KIND_LABELS: Record<ReconCardKind, string> = { identity: "WHO", leverage: "PRESSURE", verification: "PROOF", noise: "DISTRACTION" };

export function ReconSwipe({ briefing, onClose, onGoToChat }: { briefing: LevelBriefing; onClose: () => void; onGoToChat?: () => void }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<"useful" | "trash" | null>(null);
  const [correct, setCorrect] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const card = briefing.cards[index];
  const complete = index >= briefing.cards.length;

  const classify = (useful: boolean) => {
    if (!card || answer) return;
    setAnswer(useful ? "useful" : "trash");
    if (useful === card.useful) setCorrect((value) => value + 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (answer || complete) return;
      if (event.key === "ArrowLeft") classify(false);
      if (event.key === "ArrowRight") classify(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reset = () => { setIndex(0); setAnswer(null); setCorrect(0); };
  const usefulCards = briefing.cards.filter((item) => item.useful);

  return (
    <div className="fixed inset-0 z-[70] flex min-h-screen items-center justify-center bg-ink/80 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="Recon Swipe briefing">
      <Panel className="flex h-[calc(100vh-1rem)] w-full max-w-4xl flex-col overflow-hidden p-0 sm:h-[min(760px,calc(100vh-2.5rem))]">
        <TitleBar title="RECON SWIPE.EXE" tone="sky" right={<RetroButton plain className="h-7 w-7 bg-paper p-0 text-base" onClick={onClose} aria-label="Close Recon Swipe" title="Close">×</RetroButton>} />
        <div className="flex items-center gap-3 border-b-2 border-ink bg-paper px-3 py-2">
          <span className="font-mono text-[10px] font-bold">TARGET: {briefing.target.toUpperCase()}</span>
          <div className="ml-auto flex gap-1" aria-label={`${Math.min(index, briefing.cards.length)} of ${briefing.cards.length} cards sorted`}>
            {briefing.cards.map((item, cardIndex) => <span key={item.id} className={cn("h-2.5 w-7 border border-ink", cardIndex < index ? "bg-mint" : cardIndex === index && !complete ? "bg-mustard" : "bg-os-dark/20")} />)}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-background p-4 sm:p-8">
          {!complete && card ? (
            <div className="w-full max-w-xl">
              <div className="mb-4 text-center">
                <p className="font-mono text-[10px] font-bold tracking-widest">CARD {index + 1} / {briefing.cards.length}</p>
                <h2 className="mt-1 font-sans text-xl font-black sm:text-2xl">Useful for the case—or noise?</h2>
                <p className="mt-1 text-sm font-semibold text-os-shadow">{briefing.prompt}</p>
              </div>
              <div className={cn("mx-auto flex min-h-64 max-w-md touch-pan-y flex-col justify-between border-2 border-ink p-5 shadow-[6px_6px_0px_0px_var(--ink)]", answer === null ? "bg-paper" : (answer === "useful") === card.useful ? "bg-mint" : "bg-coral")} onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={(event) => { if (pointerStart.current === null) return; const distance = event.clientX - pointerStart.current; pointerStart.current = null; if (Math.abs(distance) >= 55) classify(distance > 0); }}>
                <div className="flex items-center justify-between gap-2"><span className="border-2 border-ink bg-lilac px-2 py-1 font-mono text-[10px] font-bold">RECON NOTE</span><span className="font-mono text-[10px] font-bold">#{String(index + 1).padStart(2, "0")}</span></div>
                <p className="my-6 text-center font-sans text-xl font-black leading-snug sm:text-2xl">{card.statement}</p>
                {answer ? <div className="border-t-2 border-ink pt-3 text-center"><p className="font-mono text-xs font-black">{(answer === "useful") === card.useful ? "✓ CORRECT" : "✗ NOT QUITE"} · {card.useful ? "KEEP" : "TRASH"}</p><p className="mt-1 text-sm font-semibold">{card.reveal}</p></div> : <p className="text-center font-mono text-[10px] font-bold text-os-shadow">SWIPE OR USE THE BUTTONS</p>}
              </div>
              {answer ? <div className="mt-5 flex justify-center"><RetroButton onClick={() => { setAnswer(null); setIndex((value) => value + 1); }}>{index + 1 === briefing.cards.length ? "BUILD CHEAT SHEET →" : "NEXT CARD →"}</RetroButton></div> : <div className="mt-5 grid grid-cols-2 gap-3"><RetroButton className="bg-coral py-3" onClick={() => classify(false)}>← TRASH</RetroButton><RetroButton className="bg-mint py-3" onClick={() => classify(true)}>KEEP →</RetroButton></div>}
            </div>
          ) : (
            <div className="w-full max-w-2xl">
              <div className="mb-5 text-center"><span className="inline-block border-2 border-ink bg-mint px-3 py-1 font-mono text-xs font-black shadow-[3px_3px_0px_0px_var(--ink)]">RECON COMPLETE · {correct}/{briefing.cards.length}</span><h2 className="mt-4 font-sans text-3xl font-black">Your three case essentials</h2><p className="mt-1 text-sm font-semibold text-os-shadow">Use these in Chat. Everything else was distraction.</p></div>
              <div className="grid gap-3 sm:grid-cols-3">{usefulCards.map((item, itemIndex) => <div key={item.id} className={cn("border-2 border-ink p-3 shadow-[3px_3px_0px_0px_var(--ink)]", itemIndex === 0 ? "bg-lilac" : itemIndex === 1 ? "bg-mustard" : "bg-mint")}><p className="font-mono text-[10px] font-black">0{itemIndex + 1} · {KIND_LABELS[item.kind]}</p><p className="mt-2 text-sm font-black leading-snug">{item.statement}</p></div>)}</div>
              <div className="mt-6 flex flex-wrap justify-center gap-2"><RetroButton className="bg-paper" onClick={reset}>REPLAY ↻</RetroButton><RetroButton className="bg-paper" onClick={onClose}>BACK TO DESK</RetroButton><RetroButton onClick={onGoToChat}>OPEN CHAT →</RetroButton></div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}