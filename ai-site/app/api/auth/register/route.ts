import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql, initDb } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = schema.parse(await req.json());
    const existing = await sql`SELECT id FROM users WHERE email = ${body.email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }
    const hash = await bcrypt.hash(body.password, 10);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await sql`
      INSERT INTO verify_codes (email, code, expires_at)
      VALUES (${body.email}, ${code}, NOW() + INTERVAL '5 minutes')
    `;
    await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${body.email}, ${hash})
    `;
    const mail = await sendVerificationEmail(body.email, code);
    return NextResponse.json(mail);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
