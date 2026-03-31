import type { Metadata } from "next";

import { appConfig } from "@/lib/settings";

import "./globals.css";

export const metadata: Metadata = {
  title: appConfig.siteName,
  description: appConfig.siteDescription,
  metadataBase: new URL(appConfig.siteUrl)
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
