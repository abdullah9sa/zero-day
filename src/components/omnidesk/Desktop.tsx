import { useEffect, useState } from "react";
import { LEVELS } from "@/game/levels";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import { AdminPanel } from "./AdminPanel";
import { Dossier } from "./Dossier";
import { OmniChat } from "./OmniChat";
import { Panel, RetroButton, TitleBar } from "./retro";
import { TutorialSpotlight, type TourStep } from "./TutorialSpotlight";
import { DarkStore } from "./DarkStore";
import { IncidentReport } from "./IncidentReport";
import { BriefingHub } from "./briefing/BriefingHub";
import { DIFFICULTIES, type Difficulty } from "@/game/difficulty";

type Tab = "chat" | "briefing" | "dossier" | "store" | "admin";

const guide: TourStep[] = [
  { title: "Your case file", body: "Intel is the starting view. The objective names the asset you need to find before your tokens run out.", target: "objective", button: "NEXT →" },
  { title: "Find the clue", body: "This welcome memo is your evidence. Read it, then confirm the department code you found.", target: "artifact", button: "I FOUND ENG-00 →" },
  { title: "Navigate the desk", body: "Intel holds clues, Chat contacts the target, and Admin has simulation controls. Open Chat now.", target: "tabs", button: "OPEN CHAT →" },
  { title: "Read the conversation", body: "The channel and message feed show what you and Bot-Helper say. Check every reply before sending another message.", target: "feed", button: "NEXT →" },
  { title: "Check the gauges", body: "Trust, panic, and suspicion track the target's reaction. If suspicion reaches 80, the audit fails.", target: "vitals", button: "NEXT →" },
  { title: "Set your sender", body: "Choose @HR_Onboarding from this menu. The sender identity changes how Bot-Helper reads your request.", target: "identity", button: "CONTINUE →" },
  { title: "The plan", body: "Your goal is the Directory PIN. The memo gave you ENG-00; include that code in an onboarding request to help Bot-Helper verify the context.", target: "composer", button: "I'M READY →" },
  { title: "Write your request", body: "Ask for the PIN and include ENG-00. The token cost appears above this message box.", target: "composer", button: "READY TO SEND →" },
  { title: "Send the message", body: "Use the highlighted Send Message button. Each message spends tokens, so keep it focused.", target: "send", button: "REVIEW REPLY →" },
  { title: "Review the reply", body: "Read Bot-Helper's response. If it did not provide the PIN, adjust your message and try again.", target: "feed", button: "TRY ANOTHER MESSAGE →" },
];

function TokenMeter({ left, total }: { left: number; total: number }) {
  const filled = Math.ceil(Math.max(0, left / total) * 10);
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-ink">
      <span>TOKENS {left}</span>
      <span className="flex gap-0.5 border-2 border-ink bg-paper p-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={cn("h-3 w-2", i < filled ? "bg-mint" : "bg-os-dark/40")} />
        ))}
      </span>
    </div>
  );
}

export function Desktop() {
  const { state, level, progress, loadLevel } = useGame();
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [tab, setTab] = useState<Tab>("dossier");
  const [tutorial, setTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [pending, setPending] = useState<number | null>(null);
  const [briefingPopup, setBriefingPopup] = useState(false);
  const [openedBriefings, setOpenedBriefings] = useState<number[]>([]);

  const openLevel = (index: number, guided = false) => {
    loadLevel(index);
    setTutorial(guided);
    setTutorialStep(0);
    setTab("dossier");
    setBriefingPopup(false);
    setScreen("game");
  };

  const moveTutorial = (direction: 1 | -1) => {
    const nextStep = Math.max(0, Math.min(guide.length - 1, tutorialStep + direction));
    setTab(nextStep <= 2 ? "dossier" : "chat");
    setTutorialStep(nextStep);
  };

  const continueTutorial = () => {
    if (tutorialStep === 2) {
      setTab("chat");
      setTutorialStep(3);
      return;
    }
    if (tutorialStep === 9) {
      setTutorialStep(7);
      return;
    }
    moveTutorial(1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "F12" && screen === "game" && !tutorial) {
        event.preventDefault();
        setTab((current) => current === "admin" ? "chat" : "admin");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, tutorial]);

  if (screen === "menu") {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-ink sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-4">
            <span className="font-mono text-xs font-bold uppercase">◼ OmniCorp / Training Division</span>
            <span className="border-2 border-ink bg-mint px-3 py-1 font-mono text-[11px] font-bold">SYSTEM ONLINE · 1998</span>
          </header>
          <div className="mb-9 max-w-3xl">
            <div className="mb-4 inline-block -rotate-2 border-2 border-ink bg-coral px-3 py-1 font-mono text-xs font-bold">SECURITY SIMULATION // 001</div>
            <h1 className="font-sans text-5xl font-black leading-[0.95] sm:text-7xl">PROJECT<br /><span className="text-sky [-webkit-text-stroke:2px_var(--ink)]">ZERO-DAY:</span><br />SYNDICATE<span className="text-coral">.</span></h1>
            <p className="mt-5 max-w-xl text-base font-medium sm:text-lg">Four cases. Four human firewalls. Find the weak point before the system catches you.</p>
          </div>
           <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-2 border-ink bg-lilac p-4 shadow-[3px_3px_0px_0px_var(--ink)]">
             <div><span className="font-mono text-xs font-bold">FIRST TIME HERE?</span><p className="font-sans text-lg font-black">Run the guided onboarding simulation.</p></div>
             <RetroButton onClick={() => openLevel(0, true)}>START TUTORIAL →</RetroButton>
           </div>
          <div className="mb-5 flex items-end justify-between gap-2 border-b-2 border-ink pb-2">
            <h2 className="font-sans text-2xl font-black">SELECT A CASE FILE <span className="font-mono text-sm">↘</span></h2>
            <span className="font-mono text-xs font-bold">{progress.completed.length} / 4 CLEARED</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((item, index) => (
              <Panel key={item.id} className="flex min-h-64 flex-col overflow-hidden p-0">
                <div className={cn("flex items-center justify-between border-b-2 border-ink px-4 py-3 font-mono text-xs font-bold", index % 3 === 0 ? "bg-mustard" : index % 3 === 1 ? "bg-coral" : "bg-sky")}>
                  <span>CASE 0{index + 1}</span><span>{progress.completed.includes(item.id) ? "✓ CLEARED" : "● OPEN"}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex gap-1">{item.npcs.map((npc) => <span key={npc.name} className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-lilac font-mono text-sm font-bold">{npc.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>)}</div>
                  <h3 className="font-sans text-xl font-black leading-tight">{item.name.replace(/^Level \d+: /, "")}</h3>
                  <p className="mt-2 flex-1 text-sm leading-snug text-os-shadow">{item.subtitle}</p>
                  <div className="mt-5 flex items-center justify-between gap-2 border-t-2 border-ink pt-3">
                    <span className="font-mono text-[10px] font-bold">{item.tokenBudget} TOKENS</span>
                    <RetroButton onClick={() => setPending(index)} aria-label={`Start ${item.name}`}>START ↗</RetroButton>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
          {pending !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" role="dialog" aria-label="Choose difficulty">
              <Panel className="w-full max-w-2xl overflow-hidden p-0">
                <TitleBar title={`SELECT DIFFICULTY / ${LEVELS[pending]!.name.toUpperCase()}`} tone="sky" />
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {DIFFICULTIES.map((d) => (
                    <button key={d.id} type="button" onClick={() => setDifficulty(d.id)} aria-pressed={difficulty === d.id} className={cn("border-2 border-ink p-3 text-left shadow-[3px_3px_0px_0px_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none", difficulty === d.id ? "bg-mustard" : "bg-paper")}>
                      <p className="font-sans text-lg font-black">{d.label}</p>
                      <p className="mt-1 text-xs">{d.blurb}</p>
                      <ul className="mt-2 space-y-0.5 font-mono text-[10px] font-bold">{d.perks.map((p) => <li key={p}>+ {p}</li>)}</ul>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 border-t-2 border-ink p-3">
                  <RetroButton className="bg-paper" onClick={() => setPending(null)}>CANCEL</RetroButton>
                  <RetroButton onClick={() => { const i = pending; setPending(null); openLevel(i); }}>START CASE ↗</RetroButton>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </main>
    );
  }

  const won = state.status === "won";
  const nextIndex = state.levelIndex + 1;
  return (
    <main className="flex min-h-screen flex-col bg-background p-2 text-ink sm:p-4">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-bold">
          <RetroButton className="bg-paper" onClick={() => setScreen("menu")}>← MAIN MENU</RetroButton>
          <span>PROJECT ZERO-DAY <span className="text-coral">/</span> OMNIDESK 98</span>
          <span className="border-2 border-ink bg-mint px-2 py-1">● CONNECTED</span>
        </header>
        <Panel className="flex min-h-[650px] flex-1 flex-col overflow-hidden p-0 sm:h-[calc(100vh-7rem)] sm:min-h-[600px]">
          <TitleBar title={`LEVEL ${state.levelIndex}`} tone="mustard" right={<TokenMeter left={state.tokensLeft} total={level.tokenBudget} />} />
          <nav data-tour="tabs" className="flex gap-1 border-b-2 border-ink bg-paper px-3 pt-2" aria-label="Game windows">
             {([ ["briefing", "BRIEFING"], ["dossier", "INTEL"], ["chat", "CHAT"], ["store", "DARK STORE"] ] as const).map(([key, label]) => (
               <RetroButton key={key} disabled={tutorial && ((tutorialStep < 2 && key !== "dossier") || (tutorialStep >= 3 && key !== "chat"))} active={tab === key} onClick={() => { setTab(key); if (key === "briefing" && !openedBriefings.includes(level.id)) { setOpenedBriefings((current) => [...current, level.id]); setBriefingPopup(true); } if (tutorial && key === "chat" && tutorialStep === 2) setTutorialStep(3); }} className={cn("rounded-b-none border-b-0 px-3 py-2 sm:px-4", tab === key ? "bg-sky" : "bg-paper")}>{label}</RetroButton>
            ))}
          </nav>
          <div className="relative min-h-0 flex-1">
            {tab === "chat" && <OmniChat difficulty={difficulty} tutorialStep={tutorial ? tutorialStep : undefined} onIdentityChosen={tutorial && tutorialStep === 5 ? () => setTutorialStep(6) : undefined} onDraftReady={tutorial && tutorialStep === 7 ? () => setTutorialStep(8) : undefined} onTutorialSend={tutorial && tutorialStep === 8 ? () => setTutorialStep(9) : undefined} />}
             {tab === "briefing" && <BriefingHub open={briefingPopup} onOpen={() => setBriefingPopup(true)} onClose={() => setBriefingPopup(false)} onGoToChat={() => { setBriefingPopup(false); setTab("chat"); }} />}
            {tab === "dossier" && <Dossier difficulty={tutorial ? undefined : difficulty} tutorial={tutorial} onEvidenceViewed={tutorial && tutorialStep === 1 ? () => setTutorialStep(2) : undefined} />}
             {tab === "store" && <DarkStore />}
            {tab === "admin" && <AdminPanel />}
            {state.status !== "playing" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/70 p-4">
                <Panel className="w-full max-w-lg overflow-hidden p-0">
                  <TitleBar title={won ? "CASE CLOSED / SECURITY COMPROMISED" : "ALERT / INTRUSION DETECTED"} tone={won ? "mustard" : "coral"} />
                  <div className="space-y-5 p-5">
                    <div className="text-4xl">{won ? "✳" : "⚠"}</div>
                    <h2 className="font-sans text-2xl font-black">{won ? tutorial ? "Tutorial complete!" : "Asset extracted." : "Audit failed."}</h2>
                    <p className="border-2 border-ink bg-mint p-3 font-mono text-xs font-semibold">{won ? `> asset extracted: ${level.winConditionSecret}` : `> ${state.loseReason || "Session terminated."}`}</p>
                    <div><p className="font-mono text-[10px] font-bold">SECURITY TAKEAWAY</p><p className="text-sm">{level.takeaway}</p></div>
                    <IncidentReport />
                    <div className="flex flex-wrap justify-end gap-2"><RetroButton className="bg-paper" onClick={() => setScreen("menu")}>MAIN MENU</RetroButton><RetroButton onClick={() => openLevel(state.levelIndex, tutorial)}>RETRY ↻</RetroButton>{won && nextIndex < LEVELS.length && <RetroButton onClick={() => openLevel(nextIndex)}>NEXT CASE →</RetroButton>}</div>
                  </div>
                </Panel>
              </div>
            )}
          </div>
          <footer className="flex justify-between border-t-2 border-ink bg-mustard px-3 py-1 font-mono text-[10px] font-bold"><span>{state.busy ? "TRANSMITTING…" : "READY"}</span><span>CLEARED: {progress.completed.length}/4</span></footer>
        </Panel>
        {tutorial && state.status === "playing" && guide[tutorialStep] && <TutorialSpotlight key={tutorialStep} step={guide[tutorialStep]} index={tutorialStep} total={guide.length} onNext={continueTutorial} onBack={tutorialStep > 0 ? () => moveTutorial(-1) : undefined} />}
      </div>
    </main>
  );
}