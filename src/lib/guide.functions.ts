import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const inputSchema = z.object({
  caseTitle: z.string(), objectiveHint: z.string(), briefing: z.string(),
  people: z.array(z.string()).max(20), approaches: z.array(z.string()).max(10),
  material: z.array(z.string().max(400)).max(30).default([]),
  question: z.string().max(500),
  history: z.array(z.object({ sender: z.string(), body: z.string() })).max(20).default([]),
});

export const askGuide = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => inputSchema.parse(raw))
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false };
    const provider = createOpenAI({ apiKey, baseURL: "https://ai.gateway.lovable.dev/v1", headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: `You are HEX_ROOT, an in-game guide in a fictional security-awareness puzzle game. You are a patient teacher: explain the case, its people and relationships, the evidence worth reading, and the real-world security-awareness lesson it demonstrates (e.g. pretexting, authority, urgency, insider jargon, verification gaps) and how defenders spot it. Answer in under 130 words using only the facts below, with short markdown bullets when helpful. End with one guiding question or a pointer to what to read next. Never write a finished message for them and never reveal codes or passwords. Vary your wording; don't repeat earlier answers.
Case: ${data.caseTitle}
Goal: ${data.objectiveHint}
Briefing: ${data.briefing}
People: ${data.people.join(" | ")}
Approaches: ${data.approaches.join(" | ")}
Case material: ${data.material.join(" | ")}`,
        messages: [...data.history.map((m) => ({ role: m.sender === "YOU" ? "user" as const : "assistant" as const, content: m.body })), { role: "user" as const, content: data.question }],
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
      });
      const text = (await result.text).trim();
      return text ? { ok: true, text } : { ok: false };
    } catch {
      return { ok: false };
    }
  });
