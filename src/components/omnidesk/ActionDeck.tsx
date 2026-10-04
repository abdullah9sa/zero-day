import { useState } from "react";
import { useGame, type DeckCardId } from "@/game/store";
import { cn } from "@/lib/utils";
import { RetroButton } from "./retro";

const CARDS: { id: DeckCardId; icon: string; name: string; hint: string; tone: string }[] = [
  { id: "coffee", icon: "☕", name: "Coffee Voucher", hint: "−30 suspicion · 2 turns", tone: "bg-mint" },
  { id: "alarm", icon: "🚨", name: "Fire Alarm", hint: "Security paused · 45s", tone: "bg-coral" },
  { id: "memo", icon: "📄", name: "Fake Memo", hint: "+panic for all", tone: "bg-mustard" },
  { id: "crypto", icon: "💰", name: "Crypto Wire", hint: "+trust · +suspicion", tone: "bg-lilac" },
];
const TOPICS = ["Layoffs Announced", "Stock Crash", "Surprise Security Audit"];

export function ActionDeck() {
  const { state, level, playCard } = useGame();
  const [picking, setPicking] = useState<"coffee" | "memo" | null>(null);
  const locked = state.status !== "playing" || state.busy;
  const play = (card: DeckCardId, option?: string) => { playCard(card, option); setPicking(null); };

  return (
    <div aria-label="Action deck" className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
            {CARDS.map((card) => {
              const used = state.deck.used.includes(card.id);
              return (
                <RetroButton
                  key={card.id}
                  disabled={locked || used}
                  active={picking === card.id}
                  onClick={() => card.id === "coffee" || card.id === "memo" ? setPicking(picking === card.id ? null : card.id) : play(card.id)}
                  className={cn("flex items-center gap-2 px-2 py-1.5 text-left normal-case", used ? "bg-paper opacity-50 line-through" : card.tone)}
                  title={card.hint}
                >
                  <span className="text-lg leading-none">{card.icon}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-sans text-[11px] font-black">{card.name}</span>
                    <span className="block truncate font-mono text-[9px]">{used ? "USED" : card.hint}</span>
                  </span>
                </RetroButton>
              );
            })}
          </div>
          {picking && (
            <div className="flex flex-wrap items-center gap-1.5 border-2 border-ink bg-paper p-1.5">
              <span className="font-mono text-[10px] font-bold">{picking === "coffee" ? "SEND TO →" : "TOPIC →"}</span>
              {(picking === "coffee" ? level.npcs.map((n) => n.name) : TOPICS).map((option) => (
                <RetroButton key={option} className="bg-mustard px-2 py-1 text-[10px]" onClick={() => play(picking, option)}>{option}</RetroButton>
              ))}
              <RetroButton plain className="ml-auto px-2 py-1 text-[10px]" onClick={() => setPicking(null)}>CANCEL</RetroButton>
            </div>
          )}
    </div>
  );
}
