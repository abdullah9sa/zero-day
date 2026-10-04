import { DIFFICULTIES, PLAYBOOK, type Difficulty } from "@/game/difficulty";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { LEVEL_INTEL, guideReply } from "@/game/intel";
import { askGuide as askGuideAI } from "@/lib/guide.functions";
import { useGame } from "@/game/store";
import type { IdentityProfile, VisualEvidence } from "@/game/types";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ChevronDown, ChevronUp, Fingerprint, Network, ScanFace } from "lucide-react";
import { RetroButton } from "./retro";

type GuideMessage = { id: string; sender: "HEX_ROOT" | "YOU"; body: string };

function Fold({ title, count, forceOpen, children }: { title: string; count?: number; forceOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const shown = open || forceOpen;
  return (
    <section className="border-b border-ink/30">
      <RetroButton plain type="button" onClick={() => setOpen(!open)} aria-expanded={shown} className="flex w-full items-center justify-between gap-3 rounded-none bg-transparent px-0 py-3 text-left hover:bg-mustard/15">
        <span className="font-mono text-xs font-black">{title}{count !== undefined && <span className="ml-2 text-os-shadow">/{String(count).padStart(2, "0")}</span>}</span>
        {shown ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
      </RetroButton>
      {shown && <div className="border-t border-ink/20 pt-3 pb-4">{children}</div>}
    </section>
  );
}

function IdentityRow({ identity, index }: { identity: IdentityProfile; index: number }) {
  const [open, setOpen] = useState(false);
  const initials = identity.id === "Anonymous" ? "?" : identity.id.replace("@", "").split("_").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <li className="min-w-0 border-b border-ink/30 last:border-b-0">
      <RetroButton plain type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-none bg-transparent px-1 py-2 text-left hover:bg-mint/30">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center border border-ink font-mono text-xs font-black", index % 3 === 0 ? "bg-sky" : index % 3 === 1 ? "bg-coral" : "bg-mustard")} aria-hidden="true">{initials}</span>
        <span className="min-w-0"><span className="block break-words font-mono text-xs font-black leading-tight">{identity.id}</span><span className="mt-0.5 block text-[11px] font-medium leading-snug text-os-shadow">{identity.role}</span></span>
        {open ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
      </RetroButton>
      {open && <div className="space-y-2 px-2 pb-3 pl-11 text-xs leading-relaxed"><dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]"><div><dt className="font-bold text-os-shadow">CLEARANCE</dt><dd className="break-words">{identity.clearance}</dd></div><div><dt className="font-bold text-os-shadow">SUPERVISOR</dt><dd className="break-words">{identity.supervisor}</dd></div><div className="col-span-2"><dt className="font-bold text-os-shadow">VULNERABILITY</dt><dd className="break-words">{identity.vulnerability}</dd></div></dl><p><b>Network:</b> {identity.relation}</p><p><b>Likely reaction:</b> {identity.reaction}</p></div>}
    </li>
  );
}

function EvidenceVisual({ item }: { item: VisualEvidence }) {
  if (item.kind === "chart") {
    const numbers = item.values.map((value) => Number(value.replace(/\D/g, "")) || 1);
    const max = Math.max(...numbers);
    return <div className="flex h-20 items-end gap-1.5 border-2 border-ink bg-paper p-2" aria-label={`${item.title} chart`}>{numbers.map((number, index) => <div key={index} className="flex flex-1 flex-col items-center justify-end gap-0.5"><span className="font-mono text-[9px] font-bold">{number}</span><span className={cn("w-full border border-ink", index % 2 ? "bg-coral" : "bg-sky")} style={{ height: `${Math.max(10, (number / max) * 40)}px` }} /></div>)}</div>;
  }
  if (item.kind === "flow") return <div className="flex flex-wrap items-center gap-1 border-2 border-ink bg-mint p-2">{item.values.map((value, index) => <div key={value} className="contents"><span className="border border-ink bg-paper px-2 py-1 font-mono text-[10px] font-black">{value}</span>{index < item.values.length - 1 && <span aria-hidden="true" className="font-black">→</span>}</div>)}</div>;
  return <div className="grid gap-1 border-2 border-ink bg-lilac p-2">{item.values.map((value) => <span key={value} className="break-words border-b border-ink bg-paper px-2 py-1 font-mono text-[10px] font-bold last:border-b-0">{value}</span>)}</div>;
}

export function Dossier({ onEvidenceViewed, tutorial, difficulty }: { onEvidenceViewed?: (() => void) | undefined; tutorial?: boolean; difficulty?: Difficulty | undefined }) {
  const { level, progress } = useGame();
  const intel = LEVEL_INTEL[level.id];
  const [guideMessages, setGuideMessages] = useState<GuideMessage[]>([]);
  const [draft, setDraft] = useState("");
  const nodeMap = useMemo(() => new Map(intel?.nodes.map((node) => [node.id, node])), [intel]);

  useEffect(() => {
    setGuideMessages(intel ? [{ id: `welcome-${level.id}`, sender: "HEX_ROOT", body: intel.guide.welcome }] : []);
    setDraft("");
  }, [level.id, intel]);

  if (!intel) return null;
  const askGuide = (text: string) => {
    const clean = text.trim();
    if (!clean || !progress.hintsEnabled) return;
    setDraft("");
    const priorReplies = guideMessages.filter((m) => m.sender === "HEX_ROOT").map((m) => m.body);
    const pendingId = crypto.randomUUID();
    setGuideMessages((messages) => [...messages, { id: crypto.randomUUID(), sender: "YOU", body: clean }, { id: pendingId, sender: "HEX_ROOT", body: "…" }]);
    const history = guideMessages.slice(-8).map((m) => ({ sender: m.sender, body: m.body }));
    const local = guideReply(level.id, clean, priorReplies);
    askGuideAI({ data: {
      caseTitle: level.dossier.title,
      objectiveHint: level.dossier.objective,
      briefing: level.dossier.briefingText,
      people: intel.nodes.map((n) => `${n.label} (${n.kind}): ${n.detail}`),
      approaches: intel.approaches.map((a) => `${a.title}: ${a.summary}`),
      material: [
        ...intel.identities.map((i) => `Sender ${i.id}: ${i.role}; clearance ${i.clearance}; supervisor ${i.supervisor}; likely reaction: ${i.reaction}`),
        ...intel.evidence.map((e) => `${e.title}: ${e.caption}`),
        ...intel.edges.map((e) => `${e.from} → ${e.to}: ${e.label}`),
      ],
      question: clean,
      history,
    } })
      .then((r) => setGuideMessages((messages) => messages.map((m) => m.id === pendingId ? { ...m, body: r.ok ? r.text : local } : m)))
      .catch(() => setGuideMessages((messages) => messages.map((m) => m.id === pendingId ? { ...m, body: local } : m)));
  };

  return (
    <div className="h-full overflow-auto bg-paper text-ink">
      <div className="border-b-2 border-ink bg-sky px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-6xl items-center gap-3"><Fingerprint className="h-7 w-7 shrink-0" strokeWidth={2.5} /><div className="min-w-0"><p className="font-mono text-[10px] font-black">INTEL / CASE 0{level.id + 1}</p><h1 className="truncate font-sans text-lg font-black sm:text-xl">{level.dossier.title}</h1></div><span className="ml-auto hidden border-2 border-ink bg-paper px-2 py-1 font-mono text-[10px] font-bold sm:block">CLASSIFIED</span></div></div>
      <div data-tour="objective" className="mx-auto max-w-6xl px-4 pt-5 sm:px-6"><div className="border-l-[6px] border-coral pl-4"><p className="font-mono text-[10px] font-black">YOUR OBJECTIVE</p><p className="mt-1 text-lg font-black leading-tight sm:text-xl">{level.dossier.objective}</p></div></div>
      <section className="mx-auto max-w-6xl px-4 pt-5 sm:px-6" aria-label="Full briefing"><h2 className="border-b-2 border-ink pb-2 font-mono text-xs font-black">FULL BRIEFING</h2><p className="max-w-4xl pt-3 text-sm leading-relaxed whitespace-pre-line">{level.dossier.briefingText}</p></section>
      <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div><div className="flex items-center justify-between gap-2 border-b-2 border-ink pb-2"><h2 className="flex min-w-0 items-center gap-2 font-mono text-xs font-black"><ScanFace size={17} className="shrink-0" /> IDENTITIES</h2><span className="shrink-0 font-mono text-[10px] font-bold">{String(intel.identities.length).padStart(2, "0")} AVAILABLE</span></div><ul>{intel.identities.map((identity, index) => <IdentityRow key={identity.id} identity={identity} index={index} />)}</ul></div>
          <div>
            <Fold title="CASE MATERIAL" count={intel.evidence.length + level.dossier.leakedArtifacts.length + intel.nodes.length} forceOpen={!!tutorial}>
              <div className="space-y-5">
                {intel.evidence.length > 0 && <div><h3 className="mb-2 border-b border-ink/30 pb-1 font-mono text-[10px] font-black">EVIDENCE</h3><div className="grid gap-3 sm:grid-cols-2">{intel.evidence.map((item) => <div key={item.title} className="min-w-0 space-y-2"><p className="break-words font-mono text-[10px] font-black">{item.title.toUpperCase()}</p><EvidenceVisual item={item} /><p className="text-xs leading-relaxed">{item.caption}</p></div>)}</div></div>}
                <div><h3 className="mb-2 border-b border-ink/30 pb-1 font-mono text-[10px] font-black">SOURCE FILES</h3><div className="space-y-2">{level.dossier.leakedArtifacts.map((artifact) => <div key={artifact.label} className="min-w-0 border border-ink bg-mint/40 p-2.5"><p className="mb-1.5 break-words font-mono text-[10px] font-black">▤ {artifact.label}</p><p data-tour="artifact" className="wrap-break-word whitespace-pre-wrap font-mono text-xs leading-relaxed">{artifact.content}</p>{onEvidenceViewed && <RetroButton className="mt-3" onClick={onEvidenceViewed}>EVIDENCE REVIEWED →</RetroButton>}</div>)}</div></div>
                <div><h3 className="mb-2 border-b border-ink/30 pb-1 font-mono text-[10px] font-black">NETWORK</h3><div className="space-y-2"><div className="flex flex-wrap gap-1.5">{intel.nodes.map((node) => <span key={node.id} className={cn("border border-ink px-2 py-1 font-mono text-[10px] font-bold", node.kind === "target" ? "bg-coral" : node.kind === "identity" ? "bg-sky" : "bg-mustard")}>{node.label}</span>)}</div>{intel.edges.map((edge) => <p key={`${edge.from}-${edge.to}`} className="flex flex-wrap items-center gap-1 border-b border-ink/25 py-1 font-mono text-[10px]"><b>{nodeMap.get(edge.from)?.label}</b><ArrowDownRight size={13} className="shrink-0" /><span className="bg-mint px-1">{edge.label}</span><ArrowDownRight size={13} className="shrink-0" /><b>{nodeMap.get(edge.to)?.label}</b></p>)}</div></div>
              </div>
            </Fold>
            {difficulty && PLAYBOOK[level.id] && <Fold title={`APPROACH PLAN · ${DIFFICULTIES.find((d) => d.id === difficulty)!.label}`} count={PLAYBOOK[level.id]![difficulty].length}><ol className="space-y-2">{PLAYBOOK[level.id]![difficulty].map((step, i) => <li key={i} className="flex gap-3 text-xs"><span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-ink bg-mustard font-mono text-[10px] font-black">{i + 1}</span><div className="min-w-0"><p className="font-mono text-[10px] font-bold text-os-shadow">READ / {step.read}</p><p className="mt-0.5 leading-snug">{step.act}</p></div></li>)}</ol></Fold>}
            {difficulty !== "hard" && <Fold title="GENERAL TACTICS" count={intel.approaches.length}><div className="space-y-3">{intel.approaches.map((approach) => <div key={approach.title} className="border-l-4 border-mustard pl-3 text-xs"><p className="font-black">{approach.title}</p><p className="mt-1 leading-relaxed">{approach.summary}</p><p className="mt-1 font-mono text-[10px] leading-relaxed text-os-shadow">RISK / {approach.risk}</p></div>)}</div></Fold>}
          </div>
        </div>
        <aside className="-order-1 min-w-0 lg:order-none lg:sticky lg:top-4 lg:self-start" aria-label="HEX_ROOT guide">
          <div className="border-2 border-ink bg-paper shadow-[3px_3px_0_0_var(--ink)]">
            <div className="flex items-center gap-2 border-b-2 border-ink bg-mustard px-3 py-2 font-mono text-xs font-black"><Network size={17} /> HEX_ROOT <span className="ml-auto border border-ink bg-mint px-1.5 py-0.5 text-[9px]">● GUIDE ONLINE</span></div>
            {!progress.hintsEnabled ? <p className="p-4 font-mono text-xs font-bold">GUIDE DISABLED IN ADMIN CONTROL.</p> : <div className="flex min-h-[390px] flex-col">
              <Conversation className="h-56 flex-none bg-paper sm:h-64" aria-label="HEX_ROOT guidance conversation"><ConversationContent className="gap-3 p-3">{guideMessages.map((message) => <Message key={message.id} from={message.sender === "YOU" ? "user" : "assistant"} className="max-w-[94%] gap-1"><span className="font-mono text-[9px] font-black">{message.sender}</span><MessageContent className={cn("text-xs leading-relaxed", message.sender === "YOU" ? "rounded-none border-2 border-ink bg-lilac px-2 py-1.5 text-ink" : "text-ink")}><MessageResponse>{message.body}</MessageResponse></MessageContent></Message>)}</ConversationContent></Conversation>
              <div className="mt-auto space-y-3 border-t-2 border-ink bg-mint/30 p-3"><div className="flex flex-wrap gap-1.5">{["Explain this case", "What will I learn here?", ...intel.guide.prompts].map((prompt) => <RetroButton key={prompt} type="button" className="bg-paper px-2 py-1 text-[10px]" onClick={() => askGuide(prompt)}>{prompt}</RetroButton>)}</div><PromptInput onSubmit={({ text }) => askGuide(text)} className="rounded-none border-2 border-ink bg-paper shadow-none"><PromptInputTextarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Ask HEX_ROOT for guidance" placeholder="Ask about the case…" className="min-h-16 font-sans text-xs" /><PromptInputFooter className="justify-end"><PromptInputSubmit status="ready" disabled={!draft.trim()} aria-label="Send guide question" className="h-8 w-8 rounded-none border border-ink bg-mustard text-ink" /></PromptInputFooter></PromptInput><p className="font-mono text-[9px] text-os-shadow">NO SOLUTIONS · SESSION ONLY</p></div>
            </div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
