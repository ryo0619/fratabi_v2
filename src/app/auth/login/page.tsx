import LoginClient from "./LoginClient";
import PageBackground from "@/components/layout/PageBackground";
import { garamond, decol, zenMaru } from "@/app/layout";

type SearchParams = Record<string, string | string[] | undefined>;

export default function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const errorParam = searchParams?.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <main className="relative min-h-svh overflow-hidden">
      <PageBackground />
      <section className="grid min-h-svh place-items-center p-6">
        <div className="min-h-svh grid place-items-center p-6">
          <div className="w-full max-w-sm space-y-15">
            <h1 className={`${zenMaru.className} text-4xl font-semibold`}>フラたび</h1>
            {error && <p className="text-sm text-red-600">ログインに失敗しました: {error}</p>}
            <LoginClient />
            <noscript>
              <p className="text-sm text-gray-600">
                ※ JavaScript を有効にしてログインしてください。
              </p>
            </noscript>
          </div>
        </div>
      </section>
    </main>
  );
}
