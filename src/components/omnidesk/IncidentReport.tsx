import { useGame } from "@/game/store";
import { Panel, RetroButton, TitleBar } from "./retro";

export function IncidentReport() {
  const { state, level } = useGame();
  const won = state.status === "won";
  const used = level.tokenBudget - state.tokensLeft;
  const finalStats = level.npcs.map((npc) => ({ name: npc.name, stats: state.stats[npc.name] }));

  const download = () => {
    const styles = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;
    const context = canvas.getContext("2d");
    if (!context) return;
    const paper = color("--paper", "ivory");
    const ink = color("--ink", "black");
    const accent = color(won ? "--mustard" : "--coral", won ? "gold" : "tomato");
    const mint = color("--mint", "lightgreen");
    context.fillStyle = paper;
    context.fillRect(0, 0, 1200, 1200);
    context.fillStyle = ink;
    context.fillRect(55, 55, 1090, 1090);
    context.fillStyle = paper;
    context.fillRect(65, 65, 1070, 1070);
    context.fillStyle = accent;
    context.fillRect(65, 65, 1070, 130);
    context.fillStyle = ink;
    context.font = "bold 42px monospace";
    context.fillText("OMNICORP INCIDENT REPORT", 105, 145);
    context.font = "bold 72px sans-serif";
    context.fillText(won ? "SECURITY COMPROMISED" : "DEFENSE HELD", 105, 290);
    context.font = "bold 34px sans-serif";
    context.fillText(level.name.replace(/^Level \\d+: /, ""), 105, 360);
    context.fillStyle = mint;
    context.fillRect(105, 420, 990, 120);
    context.fillStyle = ink;
    context.font = "bold 28px monospace";
    context.fillText(`TOKENS USED: ${used}/${level.tokenBudget}`, 135, 475);
    context.fillText(`TOOLS DEPLOYED: ${state.exploitUses.length}`, 135, 520);
    context.fillText(`ASSET STATUS: ${won ? "EXTRACTED" : "PROTECTED"}`, 135, 565);
    context.font = "bold 25px monospace";
    let y = 650;
    finalStats.forEach(({ name, stats }) => {
      context.fillText(`${name}: TRUST ${stats?.trust ?? 0} / PANIC ${stats?.panic ?? 0} / SUSP ${stats?.suspicion ?? 0}`, 105, y);
      y += 55;
    });
    context.font = "24px sans-serif";
    const words = level.takeaway.split(" ");
    let line = "";
    y += 40;
    context.fillText("SECURITY TAKEAWAY", 105, y);
    y += 45;
    for (const word of words) {
      const candidate = `${line}${word} `;
      if (context.measureText(candidate).width > 950) {
        context.fillText(line, 105, y);
        line = `${word} `;
        y += 38;
      } else line = candidate;
    }
    context.fillText(line, 105, y);
    context.font = "bold 20px monospace";
    context.fillText("PROJECT ZERO-DAY: SYNDICATE // TRAINING SIMULATION", 105, 1090);
    const link = document.createElement("a");
    link.download = `incident-report-case-${level.id + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Panel className="overflow-hidden p-0">
      <TitleBar title="INCIDENT REPORT / EXPORT" tone="sky" small />
      <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="font-mono text-xs font-bold">{won ? "BREACH CONFIRMED · ASSET EXTRACTED" : "DEFENSE HELD · ASSET PROTECTED"} · {used}/{level.tokenBudget} TOKENS · {state.exploitUses.length} TOOLS</p>
          <p className="mt-1 text-sm text-os-shadow">Download a shareable summary of this simulation and its defensive lesson.</p>
        </div>
        <RetroButton onClick={download}>DOWNLOAD IMAGE ↓</RetroButton>
      </div>
    </Panel>
  );
}
