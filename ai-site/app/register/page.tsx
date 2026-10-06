"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "注册失败");
      return;
    }
    if (data.debugCode) setDebugCode(data.debugCode);
    setStep(2);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "验证失败");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">{step === 1 ? "注册工作台" : "输入验证码"}</h1>
      <p className="mt-1 text-sm text-slate-400">外贸开发信自动触达台</p>

      {step === 1 && (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">邮箱</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">密码</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位" />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "发送中…" : "获取验证码"}</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verify} className="mt-8 space-y-4">
          <p className="text-sm text-slate-400">验证码已发送至 <span className="text-slate-200">{email}</span></p>
          {debugCode && <p className="rounded-lg border border-amber-600/40 bg-amber-950/40 p-3 text-xs text-amber-300">邮件服务未配置：开发验证码为 {debugCode}</p>}
          <div>
            <label className="mb-1 block text-sm text-slate-300">验证码</label>
            <input className="input" type="text" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 位数字" />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "验证中…" : "完成注册"}</button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-400">
        已有账号？
        <Link href="/login" className="text-emerald-400 hover:underline">直接登录</Link>
      </p>
    </main>
  );
}
