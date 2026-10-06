export async function sendVerificationEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  if (!apiKey) {
    // 未配置邮件服务时，返回验证码，便于本地联调
    return { ok: true, debugCode: code, sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: "你的验证码",
        html: `<p>你的验证码是：<strong>${code}</strong></p><p>5 分钟内有效。</p>`,
      }),
    });
    if (!res.ok) return { ok: false, sent: false, error: await res.text() };
    return { ok: true, sent: true };
  } catch (e: any) {
    return { ok: false, sent: false, error: String(e?.message || e) };
  }
}
