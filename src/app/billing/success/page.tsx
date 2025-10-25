import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BillingSuccessPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const sessionId = typeof searchParams.session_id === 'string' ? searchParams.session_id : null;
  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">決済が完了しました</h1>
      {sessionId && (
        <div className="text-sm text-neutral-600">Checkout Session ID: {sessionId}</div>
      )}
      <p className="text-sm text-neutral-700">プランの反映には数秒かかることがあります。反映されない場合はページを再読み込みしてください。</p>
      <div>
        <Link href="/settings/plan" className="text-blue-600 hover:underline">プラン設定へ戻る</Link>
      </div>
    </div>
  );
}

