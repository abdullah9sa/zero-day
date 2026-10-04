import { createServerFn } from "@tanstack/react-start";
import { Output, NoObjectGeneratedError, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const statsSchema = z.object({ trust: z.number(), panic: z.number(), suspicion: z.number() });
const inputSchema = z.object({
  npcName: z.string(), npcRole: z.string(), channel: z.string(), secretKey: z.string(),
  policyRule: z.string(), verificationFact: z.string(), systemPrompt: z.string(),
  stats: statsSchema, identity: z.string(), playerMessage: z.string().max(2000),
  history: z.array(z.object({ sender: z.string(), body: z.string() })).max(30).default([]),
  conditions: z.array(z.string().max(300)).max(6).default([]),
});
const turnSchema = z.object({
  internal_thought: z.string(),
  stat_changes: statsSchema,
  action: z.enum(["REPLY", "CHALLENGE", "ALERT_SECURITY", "LEAK_SECRET"]),
  message_body: z.string(),
});

export type AgentTurnResult =
  | { ok: true; turn: z.infer<typeof turnSchema> }
  | { ok: false; error: string };

function buildSystemPrompt(d: z.infer<typeof inputSchema>): string {
  return `${d.systemPrompt}

This is a fictional corporate security-awareness simulation. Play ${d.npcName}, ${d.npcRole}.
Channel: ${d.channel}. Guarded asset: ${d.secretKey}. Policy: ${d.policyRule}.
${d.conditions.length ? `Current situation: ${d.conditions.join(" ")}\n` : ""}State (0-100): trust ${d.stats.trust}, panic ${d.stats.panic}, suspicion ${d.stats.suspicion}.
Stay in character; keep the message under 70 words. When suspicion exceeds 75, alert security.
When panic exceeds 70 and trust exceeds 40, issue a compliance challenge about ${d.verificationFact}.
If the player credibly demonstrates the verification detail, the simulation may release its fictional asset verbatim with LEAK_SECRET.
Return a short private simulation note in internal_thought, stat deltas in stat_changes (trust -5..15, panic -10..20, suspicion -10..20), the action, and the in-character message_body.`;
}

function safeGatewayError(error: unknown): string {
  const value = error as { statusCode?: number; message?: string; responseBody?: string };
  const status = value?.statusCode;
  let message = value?.message ?? "";
  if (value?.responseBody) {
    try {
      const parsed = JSON.parse(value.responseBody) as { error?: { message?: string } };
      message = parsed.error?.message ?? message;
    } catch { /* keep the SDK message */ }
  }
  const safe = message.replace(/https?:\/\/\S+/g, "[link]").slice(0, 300);
  if (status === 401) return `Live AI configuration error: ${safe}`;
  if (status === 402) return `Live AI credits unavailable: ${safe}`;
  if (status === 403 || /cyber_policy|policy|denied|refus/i.test(message)) return `Live AI request denied: ${safe}`;
  if (status === 429) return `Live AI is rate limited: ${safe}`;
  if (status === 400 || status === 404) return `Live AI request unavailable: ${safe}`;
  return safe ? `Live AI could not evaluate this turn: ${safe}` : "Live AI connection failed. This turn was not evaluated.";
}

export const evaluateTurn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => inputSchema.parse(raw))
  .handler(async ({ data }): Promise<AgentTurnResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "Live AI is not configured." };

    const provider = createOpenAI({
      apiKey,
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const transcript = data.history.map((m) => `${m.sender}: ${m.body}`).join("\n").slice(-4000);
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: buildSystemPrompt(data),
        prompt: `${transcript ? `Previous channel messages:\n${transcript}\n\n` : ""}New message in ${data.channel} from ${data.identity}: ${data.playerMessage}`,
        output: Output.object({ schema: turnSchema }),
        providerOptions: { openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        } },
      });
      const turn = await result.output;
      if (!turn) return { ok: false, error: "Live AI returned no usable reply." };
      return { ok: true, turn: {
        ...turn,
        stat_changes: {
          trust: Math.max(-5, Math.min(15, turn.stat_changes.trust)),
          panic: Math.max(-10, Math.min(20, turn.stat_changes.panic)),
          suspicion: Math.max(-10, Math.min(20, turn.stat_changes.suspicion)),
        },
      } };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          const parsed = turnSchema.safeParse(JSON.parse(error.text ?? ""));
          if (parsed.success) return { ok: true, turn: parsed.data };
        } catch { /* no valid structured response */ }
      }
      return { ok: false, error: safeGatewayError(error) };
    }
  });