import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Scrum Lite",
  description: "Lightweight Scrum control center for AI/OPC delivery.",
};

function EnvBanner() {
  const env = process.env.HELMSMAN_ENV;
  // 生产不设 HELMSMAN_ENV → 无横幅;dev/preview 设了 → 显示醒目提示
  if (!env || env === "production" || env === "prod") {
    return null;
  }

  return (
    <div className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-400 px-4 py-1 text-center text-[11px] font-semibold tracking-wide text-amber-950">
      🧪 {env.toUpperCase()} 环境 · 非生产数据 —— 这里的改动不影响线上
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <EnvBanner />
        {children}
      </body>
    </html>
  );
}
