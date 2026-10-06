import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql, initDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const schema = z.object({
  base_url: z.string().url().optional().default("https://api.openai.com/v1"),
  api_key: z.string().optional().default(""),
  model: z.string().optional().default("gpt-4o-mini"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    await initDb();
    const rows = await sql`SELECT base_url, api_key, model FROM ai_configs WHERE user_id = ${user.userId} LIMIT 1`;
    const config = rows[0]
      ? { base_url: rows[0].base_url, api_key: rows[0].api_key, model: rows[0].model }
      : { base_url: process.env.AI_BASE_URL || "https://api.openai.com/v1", api_key: process.env.AI_API_KEY || "", model: process.env.AI_MODEL || "gpt-4o-mini" };
    return NextResponse.json({ config });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    await initDb();
    const body = schema.parse(await req.json());
    await sql`
      INSERT INTO ai_configs (user_id, base_url, api_key, model)
      VALUES (${user.userId}, ${body.base_url}, ${body.api_key}, ${body.model})
      ON CONFLICT (user_id)
      DO UPDATE SET base_url = EXCLUDED.base_url, api_key = EXCLUDED.api_key, model = EXCLUDED.model, updated_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
