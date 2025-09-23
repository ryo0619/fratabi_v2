import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">ログイン</h1>
        <p className="mb-6 text-sm text-gray-600">Googleでサインインしてください。</p>
        <LoginClient />
      </div>
    </main>
  );
}
