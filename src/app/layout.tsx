import "./globals.css";
import type { Metadata } from "next";
import { ThreadProvider } from "@/components/threads/ThreadContext";
import { Cormorant_Garamond, Kaisei_Decol, Zen_Maru_Gothic } from "next/font/google";

export const metadata: Metadata = {
  title: "フラたび",
  description: "JP→FR + ふりがな + TTS",
};

export const garamond = Cormorant_Garamond({
  subsets: ["latin"], // 欧文だけなら latin でOK
  weight: ["400", "700"], // 太さ指定
  display: "swap", // FOUT対策（推奨）
});
export const decol = Kaisei_Decol({
  subsets: ["latin"], // 欧文だけなら latin でOK
  weight: ["400", "700"], // 太さ指定
  display: "swap", // FOUT対策（推奨）
});

export const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"], // 欧文だけなら latin でOK
  weight: ["400", "700"], // 太さ指定
  display: "swap", // FOUT対策（推奨）
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
} as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning className="min-h-dvh bg-gray-50 antialiased">
        <ThreadProvider>{children}</ThreadProvider>
      </body>
    </html>
  );
}
