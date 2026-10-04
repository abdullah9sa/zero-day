import { useEffect, useState } from "react";
import { RetroButton } from "./retro";

export interface TourStep {
  title: string;
  body: string;
  target: string;
  button?: string;
}

export function TutorialSpotlight({ step, index, total, onNext, onBack }: { step: TourStep; index: number; total: number; onNext: () => void; onBack?: (() => void) | undefined }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector(`[data-tour="${step.target}"]`);
    if (!element) return;
    element.scrollIntoView({ block: "nearest", behavior: "instant" });
    const update = () => setRect(element.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.target]);

  if (!rect) return null;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const left = Math.max(0, rect.left - 5);
  const top = Math.max(0, rect.top - 5);
  const right = Math.min(width, rect.right + 5);
  const bottom = Math.min(height, rect.bottom + 5);
  const cardWidth = Math.min(350, width - 28);
  const cardLeft = Math.max(14, Math.min(left, width - cardWidth - 14));
  const cardTop = bottom + 195 < height ? bottom + 12 : Math.max(12, top - 186);
  const blockers = [
    { left: 0, top: 0, width, height: top },
    { left: 0, top: bottom, width, height: height - bottom },
    { left: 0, top, width: left, height: bottom - top },
    { left: right, top, width: width - right, height: bottom - top },
  ];

  return (
    <div className="fixed inset-0 z-40 pointer-events-none" aria-live="polite">
      {blockers.map((box, i) => <div key={i} className="absolute pointer-events-auto bg-ink/75 backdrop-blur-[2px]" style={box} />)}
      <div className="absolute rounded-[3px] border-[3px] border-mustard shadow-[0_0_0_2px_var(--ink)]" style={{ left, top, width: right - left, height: bottom - top }} />
      <div className="absolute pointer-events-auto border-2 border-ink bg-paper p-4 text-ink shadow-[5px_5px_0_0_var(--mustard)]" style={{ left: cardLeft, top: cardTop, width: cardWidth }}>
        <p className="font-mono text-[10px] font-bold">FIELD GUIDE · {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</p>
        <h2 className="mt-1 font-sans text-lg font-black">{step.title}</h2>
        <p className="mt-1 text-sm leading-snug">{step.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onBack && <RetroButton className="bg-paper" onClick={onBack}>← BACK</RetroButton>}
          <RetroButton onClick={onNext}>{step.button ?? "NEXT →"}</RetroButton>
        </div>
        <p className="mt-2 font-mono text-[10px] font-bold text-os-shadow">You can also use the highlighted control.</p>
      </div>
    </div>
  );
}