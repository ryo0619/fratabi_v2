// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "img-src 'self' data: https://*.supabase.co",
  "media-src 'self' https://*.supabase.co",
  // 接続先（SWR, Supabase, OpenAI, Stripe など）
  "connect-src 'self' ws: wss: https://api.openai.com https://*.supabase.co https://api.stripe.com",
  // Next.js のRSC/ハイドレーションや各種ワーカーに必要
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "worker-src 'self' blob:",
  // スタイル
  "style-src 'self' 'unsafe-inline'",
  // OAuth等の外部フレーム
  "frame-src https://accounts.google.com https://*.supabase.co",
  // フォント
  "font-src 'self' data:",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    if (!isProd) {
      // 開発中はCSPをオフ（真っ白対策）
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
