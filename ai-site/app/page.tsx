import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white">外</span>
          外贸开发信自动触达台
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost">登录</Link>
          <Link href="/register" className="btn-primary">免费注册</Link>
        </div>
      </header>

      <section className="mt-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">AI Sales Outreach Platform</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          挖客户 · 背调 · 触达 · 报表
          <span className="text-emerald-400">一条链路全自动</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-slate-400">
          接入你的 AI 大模型，按 HS 编码从海关数据挖采购商，WhatsApp 优先、邮件兜底，
          自动按目标市场切换语言，一键生成 CRM 报表。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className="btn-primary text-base">开始使用</Link>
          <Link href="/login" className="btn-ghost text-base">已有账号登录</Link>
        </div>
      </section>

      <section className="mt-24 grid gap-5 sm:grid-cols-3">
        {[
          { t: "多类目挖掘", d: "自定义 HS 编码与品类库，不局限于单一品类" },
          { t: "WhatsApp 优先", d: "背调拿号，wa.me 直接触达；无号再走邮件" },
          { t: "AI 一键报表", d: "点击即生成 CRM 报表 + AI 简报，收尾不费力" },
        ].map((f) => (
          <div key={f.t} className="card">
            <h3 className="text-lg font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-slate-400">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="mt-24 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
        © 2026 Tengbo Billiards · 外贸开发信自动触达台
      </footer>
    </main>
  );
}
