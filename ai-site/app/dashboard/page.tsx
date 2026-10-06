"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [aiBase, setAiBase] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiMsg, setAiMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) {
        router.push("/login");
        return;
      }
      const data = await r.json();
      setUser(data.user);
      const cfg = await fetch("/api/ai/config").then((x) => x.json()).catch(() => null);
      if (cfg?.config) {
        setAiBase(cfg.config.base_url);
        setAiKey(cfg.config.api_key);
        setAiModel(cfg.config.model);
      }
    });
  }, [router]);

  async function saveAiCfg(e: FormEvent) {
    e.preventDefault();
    setAiMsg("");
    const res = await fetch("/api/ai/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_url: aiBase, api_key: aiKey, model: aiModel }),
    });
    const data = await res.json();
    setAiMsg(res.ok ? "AI 配置已保存" : (data.error || "保存失败"));
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "请求失败");
      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch (err: any) {
      setMessages([...next, { role: "assistant", content: "错误：" + (err?.message || err) }]);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">外贸开发信自动触达台</h1>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>{user?.email}</span>
          <button className="btn-ghost !py-1.5" onClick={logout}>退出</button>
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card">
          <h2 className="text-lg font-semibold">AI 触达助手</h2>
          <p className="mt-1 text-xs text-slate-500">输入你的挖客 / 背调 / 开发信需求，AI 给出策略</p>
          <div className="mt-4 h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
            {messages.length === 0 && <p className="text-slate-500">例：帮我生成台球桌（HS 950420）泰国采购商的关键词组合与开发信。</p>}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-left ${m.role === "user" ? "bg-emerald-600/20 text-emerald-100" : "bg-slate-800 text-slate-200"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="mt-4 flex gap-3">
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="问 AI…" />
            <button className="btn-primary shrink-0" disabled={busy}>{busy ? "思考中…" : "发送"}</button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">AI 模型配置</h2>
          <p className="mt-1 text-xs text-slate-500">接入你的 OpenAI 兼容大模型 Key（存于你自己的数据库）</p>
          <form onSubmit={saveAiCfg} className="mt-4 space-y-3">
            <input className="input" value={aiBase} onChange={(e) => setAiBase(e.target.value)} placeholder="Base URL，如 https://api.openai.com/v1" />
            <input className="input" value={aiKey} onChange={(e) => setAiKey(e.target.value)} placeholder="API Key：sk-..." />
            <input className="input" value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="模型名，如 gpt-4o-mini" />
            <button className="btn-primary w-full" type="submit">保存配置</button>
            {aiMsg && <p className="text-xs text-emerald-400">{aiMsg}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
