import { createFileRoute } from "@tanstack/react-router";
import { Desktop } from "@/components/omnidesk/Desktop";
import { GameProvider } from "@/game/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Zero-Day: Syndicate — OmniCorp Human Firewall Audit" },
      {
        name: "description",
        content:
          "A retro-OS social engineering simulation: talk your way past OmniCorp employees to test the human firewall.",
      },
      { property: "og:title", content: "Project Zero-Day: Syndicate" },
      {
        property: "og:description",
        content:
          "Infiltrate OmniCorp through its people. A retro 90s desktop simulation of real social engineering tactics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <GameProvider>
      <Desktop />
    </GameProvider>
  );
}
