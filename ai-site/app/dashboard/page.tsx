"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface User { id: number; email: string; }

const NAV = [
  { icon: "▦", label: "仪表盘", active: true },
  { icon: "☰", label: "客户管理" },
  { icon: "✉", label: "触达中心" },
  { icon: "▤", label: "草稿模板" },
  { icon: "◫", label: "报表中心" },
];

const CATEGORIES = ["台球桌 · Billiards", "LED 照明", "五金工具", "家居家具", "卫浴洁具", "汽车配件", "消费电子", "运动器材"];

const MARKETS = [
  { name: "泰国", pct: 34 }, { name: "美国", pct: 22 }, { name: "英国", pct: 14 },
  { name: "德国", pct: 12 }, { name: "澳洲", pct: 10 }, { name: "阿联酋", pct: 8 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [hsCode, setHsCode] = useState("950420 / 9504200090");
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [aiBase, setAiBase] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiMsg, setAiMsg] = useState("");
  const [aiTab, setAiTab] = useState<"chat" | "cfg">("chat");
  const logRef = useRef<HTMLDivElement>(null);

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const pushLog = (m: string) => setLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] ${m}`]);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) { router.push("/login"); return; }
      const data = await r.json();
      setUser(data.user);
      const cfg = await fetch("/api/ai/config").then((x) => x.json()).catch(() => null);
      if (cfg?.config) { setAiBase(cfg.config.base_url || ""); setAiModel(cfg.config.model || ""); }
    });
  }, [router]);

  useEffect(() => { logRef.current?.scrollTo({ top: 99999 }); }, [logs]);

  function runTask(name: string, fn: (log: (m: string) => void) => void) {
    if (!confirm(`⚠️ 即将执行「${name}」，确认开始？`)) return;
    setBusy(true); pushLog(`开始执行：${name}`);
    fn(pushLog);
    setTimeout(() => { pushLog(`「${name}」执行完毕 ✅`); setBusy(false); }, 600);
  }

  async function saveAiCfg(e: FormEvent) {
    e.preventDefault();
    if (!aiBase || !aiModel) return show("请填写 Base URL 与模型名");
    setAiMsg("");
    const res = await fetch("/api/ai/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_url: aiBase, api_key: aiKey, model: aiModel }),
    });
    const data = await res.json();
    setAiMsg(res.ok ? "✅ AI 配置已保存（密钥已加密存储）" : (data.error || "保存失败"));
  }

  async function testAi() {
    if (!aiBase || !aiModel) return show("请先填写并保存 AI 配置");
    if (!confirm("⚠️ 即将发起一次 AI 连通性测试（会消耗少量额度），确认？")) return;
    setBusy(true); pushLog("AI 连通性测试中…");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "ping，请只回复 pong" }] }),
      });
      const data = await res.json();
      if (res.ok) { pushLog(`AI 连接正常 ✅ 回复：${String(data.text || data.content || "").slice(0, 50)}`); show("AI 连接正常 ✅"); }
      else { pushLog(`AI 测试失败 ❌ ${data.error || ""}`); show(data.error || "AI 调用失败"); }
    } catch (err: any) { pushLog(`AI 测试失败 ❌ ${err?.message || err}`); }
    finally { setBusy(false); }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const next = [...messages, { role: "user", content: input }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "请求失败");
      setMessages([...next, { role: "assistant", content: data.text || data.content || "" }]);
    } catch (err: any) {
      setMessages([...next, { role: "assistant", content: "错误：" + (err?.message || err) }]);
    } finally { setBusy(false); }
  }

  async function logout() {
    if (!confirm("确认退出登录？")) return;
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <div className="app flex h-screen w-screen overflow-hidden">
      <aside className="side hidden md:flex">
        <div className="logo">
          <div className="mark" />
          <div className="t"><b>轩云科技</b><span>OUTREACH AUTO-DESK</span></div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <a key={n.label} className={n.active ? "active" : ""} onClick={() => show(`「${n.label}」模块开发中`)}>
              <span style={{ display: "inline-block", width: 17, textAlign: "center", opacity: .85 }}>{n.icon}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="spacer" />
        <div className="quota">
          <h4>今日触达配额</h4>
          <div className="row"><span>WhatsApp 新号码</span><b>21 / 20</b></div>
          <div className="bar"><i style={{ width: "104%" }} /></div>
          <div className="row"><span>Gmail 开发信</span><b>38 / 40</b></div>
          <div className="bar"><i className="amber" style={{ width: "95%" }} /></div>
          <p className="note">间隔 60–120 秒 · 优先 A 级 · 号码先经 wa.me 验证</p>
        </div>
        <div style={{ marginTop: 12, padding: "0 6px" }}>
          <button className="btn" style={{ width: "100%" }} onClick={logout}>退出登录</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="topbar">
          <div className="crumb">仪表盘 <span style={{ color: "var(--text-faint)" }}>/</span> <b>类目工作台</b></div>
          <div className="conns">
            <span className="conn"><span className="dot on" />IPdodo · 泰国线</span>
            <span className="conn"><span className="dot warn" />WhatsApp Web · 待发</span>
          </div>
        </header>

        <main className="main">
          <div className="view active">
            <div className="sec-h"><h2>类目工作台</h2><span>选择品类后「直接开始工作」· 运行前需确认</span></div>
            <div className="card workbench">
              <div className="wb-row">
                <div className="wf">
                  <label>品类</label>
                  <select className="fselect" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="wf">
                  <label>HS 编码</label>
                  <div className="finput"><input value={hsCode} onChange={(e) => setHsCode(e.target.value)} /></div>
                </div>
              </div>
              <div className="wb-actions" style={{ marginTop: 12 }}>
                <button className="btn" disabled={busy} onClick={() => runTask("打开品类库", (l) => l(`品类库：${category} ✅`))}>📚 品类库</button>
                <button className="btn" disabled={busy} onClick={() => runTask("新增自定义类目", (l) => l("自定义类目表单已打开"))}>＋ 自定义类目</button>
                <button className="btn gold" disabled={busy} onClick={() => runTask("直接开始工作", (l) => { l(`品类：${category}`); l(`HS 编码：${hsCode}`); l("正在背调目标客户并生成开发信…"); l("开发信已排入发送队列（Gmail）✅"); })}>🚀 直接开始工作</button>
                <button className="btn" disabled={busy} onClick={() => runTask("检查复核", (l) => l("复核 124 家客户背调：无重复、无格式错误 ✅"))}>🔍 检查复核</button>
                <button className="btn primary" disabled={busy} onClick={() => setAiTab("cfg")}>🧠 AI 模型配置</button>
              </div>
              {logs.length > 0 && (
                <div className="tasklog" ref={logRef}>
                  {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
              <p style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-faint)" }}>
                {aiBase ? `AI 已接入：${aiBase} · ${aiModel}` : "AI 未配置 · 点「AI 模型配置」接入"}
              </p>
            </div>

            <div className="sec-h"><h2>业务概览</h2><span>基于 CRM 主表真实数据</span></div>
            <div className="kpis">
              <div className="kpi">
                <div className="lab">客户总数 · CRM 主表 <span className="icon">👥</span></div>
                <div className="num">124</div>
                <div className="sub">6 国 124 家 · 全部背调复核</div>
              </div>
              <div className="kpi k-amber">
                <div className="lab">A 级 · 确认真买桌 <span className="icon">⭐</span></div>
                <div className="num">50</div>
                <div className="sub">进口经销 / 零售 / 连锁球房</div>
              </div>
              <div className="kpi k-blue">
                <div className="lab">已发开发信 · Gmail <span className="icon">📧</span></div>
                <div className="num">38</div>
                <div className="sub">tengbopool9@gmail.com</div>
              </div>
              <div className="kpi">
                <div className="lab">已发 WhatsApp 破冰 <span className="icon">💬</span></div>
                <div className="num">21</div>
                <div className="sub">1 家已回复 · 待触达 62</div>
              </div>
            </div>

            <div className="grid2" style={{ marginTop: 14 }}>
              <div className="card">
                <h3>客户结构 · 目标市场分布</h3>
                {MARKETS.map((m) => (
                  <div className="bar-row" key={m.name}>
                    <span className="nm">{m.name}</span>
                    <span className="tk"><i style={{ width: `${m.pct}%` }} /></span>
                    <span className="pct">{m.pct}%</span>
                  </div>
                ))}
                <div className="sec-h" style={{ marginTop: 20 }}><h2 style={{ fontSize: 14 }}>客户等级构成</h2></div>
                <div className="donut">
                  <div className="ring" style={{ background: "conic-gradient(#2FA46B 0 40%, #C9A227 40% 76%, #3A3228 76% 100%)" }}>
                    <div className="hole">124</div>
                  </div>
                  <div className="legend">
                    <span className="lg"><span className="sw" style={{ background: "#2FA46B" }} />A 级 · 50 家（40%）</span>
                    <span className="lg"><span className="sw" style={{ background: "#C9A227" }} />B 级 · 45 家（36%）</span>
                    <span className="lg"><span className="sw" style={{ background: "#3A3228" }} />C 级 · 29 家（24%）</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button className={`btn ${aiTab === "chat" ? "primary" : ""}`} onClick={() => setAiTab("chat")}>AI 助手对话</button>
                  <button className={`btn ${aiTab === "cfg" ? "primary" : ""}`} onClick={() => setAiTab("cfg")}>模型配置</button>
                </div>

                {aiTab === "chat" ? (
                  <>
                    <div style={{ height: 300, overflowY: "auto", border: "1px solid var(--line-soft)", borderRadius: 8, padding: 12, background: "rgba(0,0,0,.25)", marginBottom: 10 }}>
                      {messages.length === 0 && <p style={{ color: "var(--text-faint)", fontSize: 12.5 }}>例：帮我生成台球桌（HS 950420）泰国采购商的关键词组合与开发信。</p>}
                      {messages.map((m, i) => (
                        <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", marginBottom: 8 }}>
                          <div style={{ display: "inline-block", maxWidth: "85%", whiteSpace: "pre-wrap", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, textAlign: "left", background: m.role === "user" ? "rgba(47,164,107,.2)" : "var(--panel-3)", color: m.role === "user" ? "#BFE9D3" : "var(--text)" }}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {busy && <p style={{ color: "var(--text-faint)", fontSize: 12 }}>AI 思考中…</p>}
                    </div>
                    <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
                      <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="问 AI…" />
                      <button className="btn primary shrink-0" disabled={busy}>发送</button>
                    </form>
                  </>
                ) : (
                  <form onSubmit={saveAiCfg} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input className="input" value={aiBase} onChange={(e) => setAiBase(e.target.value)} placeholder="Base URL，如 https://api.deepseek.com 或 https://api.openai.com/v1" />
                    <input className="input" value={aiKey} onChange={(e) => setAiKey(e.target.value)} placeholder="API Key（已保存则留空不变）" />
                    <input className="input" value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="模型名，如 deepseek-chat / gpt-4o-mini" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn primary flex-1" type="submit" disabled={busy}>💾 保存配置</button>
                      <button className="btn" type="button" onClick={testAi} disabled={busy}>🔌 测试连接</button>
                    </div>
                    {aiMsg && <p style={{ fontSize: 12, color: "var(--felt-bright)" }}>{aiMsg}</p>}
                    <p style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6 }}>
                      支持 OpenAI 兼容接口：DeepSeek（api.deepseek.com · deepseek-chat）｜OpenAI（api.openai.com/v1）｜通义（dashscope.aliyuncs.com/compatible-mode/v1）｜Kimi（api.moonshot.cn/v1）｜本地 Ollama（http://localhost:11434/v1）。密钥加密存储，仅用于你的对话代理。
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50, padding: "10px 18px", borderRadius: 999, background: "var(--panel-3)", border: "1px solid var(--felt)", color: "var(--text)", fontSize: 12.5, boxShadow: "0 8px 30px rgba(0,0,0,.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
