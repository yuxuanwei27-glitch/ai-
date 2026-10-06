export interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMsg[];
  maxTokens?: number;
}) {
  const { baseUrl, apiKey, model, messages, maxTokens = 1200 } = opts;
  if (!apiKey) throw new Error("AI_API_KEY 未配置");
  const res = await fetch(baseUrl.replace(/\/+$/, "") + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 返回为空");
  return { text: content as string };
}
