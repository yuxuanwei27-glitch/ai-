import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "外贸开发信自动触达台",
  description: "AI 驱动的外贸客户挖掘、背调、触达与报表工作台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
