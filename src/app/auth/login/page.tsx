import LoginClient from "./LoginClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const errorParam = searchParams?.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">ログイン</h1>
        {error && (
          <p className="text-sm text-red-600">ログインに失敗しました: {error}</p>
        )}
        <LoginClient />
        <noscript>
          <p className="text-sm text-gray-600">※ JavaScript を有効にしてログインしてください。</p>
        </noscript>
      </div>
    </div>
  );
}
