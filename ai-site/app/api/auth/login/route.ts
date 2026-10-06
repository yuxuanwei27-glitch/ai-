import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql, initDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = schema.parse(await req.json());
    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${body.email} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }
    const ok = await bcrypt.compare(body.password, rows[0].password_hash);
    if (!ok) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }
    const token = await signToken({ userId: rows[0].id, email: rows[0].email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
