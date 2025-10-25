import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">決済をキャンセルしました</h1>
      <p className="text-sm text-neutral-700">またいつでもお手続きいただけます。</p>
      <div>
        <Link href="/settings/plan" className="text-blue-600 hover:underline">プラン設定へ戻る</Link>
      </div>
    </div>
  );
}

