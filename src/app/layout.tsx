// fratabi_v2/src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "フラたび",
  description: "JP→FR + ふりがな + TTS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
