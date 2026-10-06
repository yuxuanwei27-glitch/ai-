import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql, initDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { chatCompletion } from "@/lib/ai";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().max(20000),
  })).min(1).max(60),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    await initDb();
    const body = schema.parse(await req.json());
    const rows = await sql`SELECT base_url, api_key, model FROM ai_configs WHERE user_id = ${user.userId} LIMIT 1`;
    const cfg = rows[0]
      ? rows[0]
      : { base_url: process.env.AI_BASE_URL || "https://api.openai.com/v1", api_key: process.env.AI_API_KEY || "", model: process.env.AI_MODEL || "gpt-4o-mini" };
    if (!cfg.api_key) {
      return NextResponse.json({ error: "尚未配置 AI Key：请在仪表盘「AI 模型配置」里填写" }, { status: 400 });
    }
    const result = await chatCompletion({
      baseUrl: cfg.base_url,
      apiKey: cfg.api_key,
      model: cfg.model,
      messages: body.messages,
    });
    await sql`
      INSERT INTO messages (user_id, role, content) VALUES
      (${user.userId}, 'user', ${body.messages[body.messages.length - 1].content}),
      (${user.userId}, 'assistant', ${result.text})
    `;
    return NextResponse.json({ text: result.text });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
