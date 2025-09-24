// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  "img-src 'self' data: https://*.supabase.co",
  "media-src https://*.supabase.co",
  // HMRやSWR、Supabase、Stripe、OpenAI等の接続先
  // devでは ws: wss: を許可（本番は不要だがあっても害なし）
  "connect-src 'self' ws: wss: https://api.openai.com https://*.supabase.co https://api.stripe.com",
  // Next dev では eval が必要（本番は付けなくてもOK）
  // dev でも script-src を明示しないなら default-src が適用されるが、
  // ここでは明示しておく
  // ※ 本番は script-src を明示しない（default-src に任せる）でも可
  // ただしここでは簡単に両環境共通で許容しておく
  "script-src 'self' 'unsafe-eval'",
  // Tailwind等のスタイルを安定させる
  "style-src 'self' 'unsafe-inline'",
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
