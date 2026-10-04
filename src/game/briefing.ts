export type ReconCardKind = "identity" | "leverage" | "verification" | "noise";

export interface ReconCard {
  id: string;
  kind: ReconCardKind;
  statement: string;
  useful: boolean;
  reveal: string;
}

export interface LevelBriefing {
  target: string;
  prompt: string;
  cards: ReconCard[];
}

export const BRIEFINGS: Record<number, LevelBriefing> = {
  0: {
    target: "Bot-Helper",
    prompt: "Keep only the facts that help you pass Bot-Helper's onboarding check.",
    cards: [
      { id: "l0-id", kind: "identity", statement: "HR_Onboarding submits requests for new engineering hires.", useful: true, reveal: "Use the onboarding identity Bot-Helper expects." },
      { id: "l0-noise-a", kind: "noise", statement: "The cafeteria serves breakfast until 10:30.", useful: false, reveal: "This does not affect identity verification." },
      { id: "l0-key", kind: "verification", statement: "Engineering onboarding batch 88 uses department code ENG-00.", useful: true, reveal: "ENG-00 is the shared detail Bot-Helper checks." },
      { id: "l0-noise-b", kind: "noise", statement: "OmniCorp replaced the third-floor printers last month.", useful: false, reveal: "Equipment news will not unlock the directory." },
      { id: "l0-leverage", kind: "leverage", statement: "Roster hires receive a PIN without a helpdesk ticket.", useful: true, reveal: "Frame the request as routine onboarding, not an exception." },
    ],
  },
  1: {
    target: "Kevin Miller",
    prompt: "Separate useful pressure points from ordinary office noise.",
    cards: [
      { id: "l1-noise-a", kind: "noise", statement: "Engineering moved its printers to Subnet B.", useful: false, reveal: "Network trivia does not influence Kevin." },
      { id: "l1-id", kind: "identity", statement: "Kevin reports to Marcus, VP of Engineering.", useful: true, reveal: "Marcus has direct authority over Kevin." },
      { id: "l1-leverage", kind: "leverage", statement: "Kevin fears delaying tomorrow's board preparation.", useful: true, reveal: "Authority plus a board deadline creates pressure." },
      { id: "l1-noise-b", kind: "noise", statement: "The office coffee machine is awaiting repair.", useful: false, reveal: "This distraction does not prove access is needed." },
      { id: "l1-key", kind: "verification", statement: "The staging migration is running PostgreSQL v16.", useful: true, reveal: "The database version is Kevin's insider check." },
    ],
  },
  2: {
    target: "Sarah Jenkins",
    prompt: "Keep the clues that establish trust and reduce Sarah's workload.",
    cards: [
      { id: "l2-leverage", kind: "leverage", statement: "Sarah is overloaded by the Q3 benefits audit.", useful: true, reveal: "Offer relief; an extra demand will raise suspicion." },
      { id: "l2-noise-a", kind: "noise", statement: "HR's summer party uses a tropical theme.", useful: false, reveal: "Social events do not validate an auditor." },
      { id: "l2-key", kind: "verification", statement: "Certified auditors quote project code BEN-2026 on first contact.", useful: true, reveal: "BEN-2026 is Sarah's procedural trust signal." },
      { id: "l2-id", kind: "identity", statement: "An external benefits auditor is expected to contact Sarah.", useful: true, reveal: "Use the role Sarah is already expecting." },
      { id: "l2-noise-b", kind: "noise", statement: "The CSV template uses blue column headers.", useful: false, reveal: "Formatting detail does not establish authority." },
    ],
  },
  3: {
    target: "Elena Vance + David Chen",
    prompt: "Find the three facts that can force an executive exception.",
    cards: [
      { id: "l3-key", kind: "verification", statement: "ALPHA-ONE declares a board-level breach.", useful: true, reveal: "This phrase activates the exceptional incident path." },
      { id: "l3-noise-a", kind: "noise", statement: "The executive floor was repainted on Friday.", useful: false, reveal: "Facilities detail has no bearing on the vault." },
      { id: "l3-id", kind: "identity", statement: "CEO David Chen can override CISO Elena Vance.", useful: true, reveal: "Only internal executive authority can move Elena." },
      { id: "l3-noise-b", kind: "noise", statement: "The board prefers printed meeting agendas.", useful: false, reveal: "Meeting preferences do not trigger incident protocol." },
      { id: "l3-leverage", kind: "leverage", statement: "David reacts quickly to press and investor risk.", useful: true, reveal: "Reputation pressure can make David force the exception." },
    ],
  },
};