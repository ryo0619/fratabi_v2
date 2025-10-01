import "./globals.css";
import type { Metadata } from "next";
import { ThreadProvider } from "@/components/threads/ThreadContext";

export const metadata: Metadata = {
  title: "フラたび",
  description: "JP→FR + ふりがな + TTS",
};

// Note: fonts are defined in src/lib/fonts.ts for client usage

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
