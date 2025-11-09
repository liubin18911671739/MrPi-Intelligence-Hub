import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MrPi Intelligence Hub",
  description: "统一服务多端的中台与 API 系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
