import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql, initDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = schema.parse(await req.json());
    const rows = await sql`
      SELECT code FROM verify_codes
      WHERE email = ${body.email} AND code = ${body.code}
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "验证码无效或已过期" }, { status: 400 });
    }
    const users = await sql`SELECT id, email FROM users WHERE email = ${body.email} LIMIT 1`;
    if (users.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 400 });
    }
    await sql`UPDATE users SET verified = TRUE WHERE id = ${users[0].id}`;
    const token = await signToken({ userId: users[0].id, email: users[0].email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
