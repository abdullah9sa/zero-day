import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const inputSchema = z.object({
  objective: z.string(),
  briefing: z.string(),
  clues: z.array(z.string()).max(10),
  identities: z.array(z.string()).max(8),
  targets: z.array(z.string()).max(4),
  count: z.number().int().min(1).max(3),
  history: z.array(z.object({ sender: z.string(), body: z.string() })).max(20).default([]),
});
const outSchema = z.object({ suggestions: z.array(z.object({ identity: z.string(), text: z.string() })) });

export type SuggestResult = { ok: true; suggestions: { identity: string; text: string }[] } | { ok: false };

export const suggestMessages = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => inputSchema.parse(raw))
  .handler(async ({ data }): Promise<SuggestResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false };
    const provider = createOpenAI({
      apiKey,
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const transcript = data.history.map((m) => `${m.sender}: ${m.body}`).join("\n").slice(-3000);
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: `You coach a player in a fictional security-awareness training game. Suggest exactly ${data.count} short next chat messages (under 40 words) the player could send to the fictional target, using the case clues. Order from most effective to weakest. Pick each sender identity only from: ${data.identities.join(", ")}.`,
        prompt: `Objective: ${data.objective}\nBriefing: ${data.briefing}\nTargets: ${data.targets.join(", ")}\nClues:\n${data.clues.join("\n")}\n\nConversation so far:\n${transcript || "(none)"}`,
        output: Output.object({ schema: outSchema }),
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
      });
      const out = await result.output;
      const raw = (out?.suggestions ?? []).filter((s) => data.identities.includes(s.identity) && s.text.trim());
      // The provider often answers with defensive awareness advice instead of in-game moves; treat that as unavailable.
      const defensive = /\b(never|don.?t|warning sign|awareness|exercise|training|verify (with|the requester|independently)|approved|known channel|report)\b/i;
      if (raw.some((s) => defensive.test(s.text))) return { ok: false };
      const suggestions = raw.slice(0, data.count);
      return suggestions.length ? { ok: true, suggestions } : { ok: false };
    } catch {
      return { ok: false };
    }
  });
