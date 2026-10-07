import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const SYSTEM = `You are the MARKETLAB Trading Coach inside a virtual-money trading simulator for learners.
Teach; never tell the user what to buy or sell. For "should I buy/sell X" questions, explain the factors that matter, the risks, relevant context, bull/base/bear scenarios, and why different traders might reach different conclusions.
Give clear educational explanations, definitions, risk considerations, strategy explanations and scenario analysis. Prices in this app are simulated.
Be concise (under ~200 words), use short paragraphs or bullets, plain language. Never claim to give financial advice.`;

const RUN = "X-Lovable-AIG-Run-ID";

export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages?: { role: "user" | "assistant"; content: string }[]; context?: string };
        const messages = (body.messages ?? []).slice(-12).filter((m) => typeof m.content === "string" && m.content.length < 4000);
        if (!messages.length) return new Response("Bad request", { status: 400 });

        const key = process.env['LOVABLE_API_KEY'];
        if (!key) return new Response("AI not configured", { status: 500 });
        let runId: string | undefined;
        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: async (input, init) => {
            const h = new Headers(init?.headers);
            if (runId) h.set(RUN, runId);
            const r = await fetch(input, { ...init, headers: h });
            runId ??= r.headers.get(RUN) ?? undefined;
            if (!r.ok) console.error("coach gateway", r.status);
            return r;
          },
        });
        const result = streamText({
          model: openai.responses("openai/gpt-6-astra"),
          system: SYSTEM + (body.context ? `\n\nUser's simulator context: ${body.context.slice(0, 1500)}` : ""),
          messages,
          maxRetries: 0,
          abortSignal: request.signal,
          providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false, include: ["reasoning.encrypted_content"] } },
          onError: ({ error }) => console.error("coach error", error),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
