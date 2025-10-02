"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const items = [
  { href: "/settings/account", label: "アカウント" },
  { href: "/settings/plan", label: "プラン" },
  // ログアウトは個別にレンダリング（確認ダイアログ付き）
];

export default function SettingsNav() {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <>
      <nav className="flex flex-col">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-neutral-100 text-neutral-900" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {it.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="text-left px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100"
        >
          ログアウト
        </button>
      </nav>

      <AlertDialog open={logoutOpen} onOpenChange={(o) => !loggingOut && setLogoutOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のセッションを終了し、ログイン画面に戻ります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              disabled={loggingOut}
              onClick={() => {
                setLoggingOut(true);
                // GET で /auth/logout へ遷移（サーバ側でサインアウト→/settings/logoutへ）
                window.location.href = "/auth/logout";
              }}
            >
              ログアウトする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
