"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import useSWR from "swr";
import { useThreadSelection } from "../threads/ThreadContext";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Thread = { id: string; title: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreateThread: () => void;
};

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error("fetch failed");
  return r.json();
};

export default function Drawer({ open, onClose, onCreateThread }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  // navigation hooks are used in ThreadsList; keep imports at file-scope

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (dx < -40) {
      setTouchStartX(null);
      onClose();
    }
  };

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <div
        onClick={onBackdropClick}
        className={clsx(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="サイドメニュー"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        className={clsx(
          "absolute left-0 top-0 h-full w-80 max-w-[88vw] bg-white shadow-xl border-r border-gray-200 flex flex-col",
          "transition-transform duration-300 will-change-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <span className="text-sm font-small">フラたび</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="size-9 grid place-items-center rounded-lg hover:bg-gray-100"
          >
            {/* * */}
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                console.log("[Drawer] createThread clicked");
                onCreateThread();
              }}
              className="w-full text-left px-3 py-3 rounded-xl hover:bg-gray-100"
              aria-label="新しいスレッドを作成"
            >
              ✏️ 新しいスレッド
            </button>

            <Link
              className="block px-3 py-3 rounded-xl hover:bg-gray-100"
              href="/favorites"
              onClick={onClose}
            >
              ⭐️ お気に入り
            </Link>

            <ThreadsList open={open} onClose={onClose} />
          </nav>
        </div>
        <div className="border-t p-3 bg-white">
          <Link
            className="block px-3 py-3 rounded-xl hover:bg-gray-100"
            href="/settings"
            onClick={onClose}
          >
            ⚙️ 設定
          </Link>
          {/* <Link
            className="mt-1 block px-3 py-3 rounded-xl hover:bg-gray-100"
            href="/settings/plan"
            onClick={onClose}
          >
            💳 プラン / 課金
          </Link> */}
        </div>
      </div>
    </div>
  );
}

function ThreadsList({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedThreadId, setSelectedThreadId } = useThreadSelection();
  const router = useRouter();
  const pathname = usePathname();
  const { data, error, isLoading, mutate } = useSWR<Thread[]>("/api/threads", fetcher, {
    shouldRetryOnError: false,
  });
  const list = Array.isArray(data) ? data : [];
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const restoreFocusEl = useRef<HTMLElement | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleting(true);

    const idx = list.findIndex((x) => x.id === targetId);
    const candidates = list.filter((x) => x.id !== targetId);
    const nextId = candidates.length
      ? (candidates[idx] ?? candidates[candidates.length - 1]).id
      : null;

    await mutate((curr?: Thread[]) => {
      const arr = Array.isArray(curr) ? curr : [];
      return arr.filter((x) => x.id !== targetId);
    }, false);

    if (selectedThreadId === targetId) {
      setSelectedThreadId(nextId ?? null);
    }

    try {
      const res = await fetch(`/api/threads/${targetId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || j?.error || "削除に失敗しました");
      }
      await mutate();
      setDeleteOpen(false);
      setDeleteTarget(null);
      setTimeout(() => restoreFocusEl.current?.focus(), 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "削除に失敗しました";
      alert(msg);
      await mutate();
    } finally {
      setDeleting(false);
    }
  };

  // Drawerが閉じたらメニューも閉じる
  useEffect(() => {
    if (!open) setMenuOpenId(null);
  }, [open]);
  return (
    <div className="pt-2">
      <div className="px-3 pb-1 text-xs text-gray-500">あなたのスレッド</div>
      {menuOpenId && <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />}
      {isLoading && <div className="px-3 py-2 text-sm text-gray-500">読み込み中...</div>}
      {error && <div className="px-3 py-2 text-sm text-red-600">取得に失敗しました</div>}
      {list.map((t) => (
        <div
          key={t.id}
          className={`px-2 py-1 rounded-xl ${
            selectedThreadId === t.id ? "bg-gray-100" : ""
          } hover:bg-gray-100 flex items-center justify-between`}
        >
          <button
            onClick={() => {
              setSelectedThreadId(t.id);
              onClose();
              if (pathname !== "/") router.push("/");
            }}
            className="min-w-0 flex-1 text-left px-1 py-1 rounded"
          >
            <span className="truncate block">{t.title}</span>
          </button>
          <div className="relative ml-2">
            <button
              aria-label="more"
              className="size-8 grid place-items-center rounded-lg hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === t.id ? null : t.id);
              }}
            >
              {/* 3点リーダー */}
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <circle cx="5" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <circle cx="19" cy="12" r="2" fill="currentColor" />
              </svg>
            </button>
            {menuOpenId === t.id && (
              <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border bg-white shadow-lg">
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-t-xl"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    const current = t.title ?? "";
                    const next = prompt("新しい名前を入力", current)?.trim();
                    if (next == null || next === current) return;
                    if (!next) return alert("名前を入力してください");
                    try {
                      const res = await fetch(`/api/threads/${t.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: next.slice(0, 80) }),
                      });
                      if (!res.ok) {
                        const j = await res.json().catch(() => ({}));
                        return alert(j?.message || j?.error || "名前の変更に失敗しました");
                      }
                      // 楽観的更新 → 再検証
                      await mutate((curr?: Thread[]) => {
                        const list = Array.isArray(curr) ? curr : [];
                        return list.map((x) => (x.id === t.id ? { ...x, title: next } : x));
                      }, false);
                      mutate();
                    } catch (err) {
                      console.error("rename failed", err);
                      alert("ネットワークエラー");
                    }
                  }}
                >
                  名前を変更
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    // TODO: 実装（招待リンクなど）
                  }}
                >
                  招待リンクを作成
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                  onClick={async (e) => {
                    e.stopPropagation();
                    restoreFocusEl.current = e.currentTarget as HTMLElement;
                    setMenuOpenId(null);
                    setDeleteTarget({ id: t.id, title: t.title });
                    setDeleteOpen(true);
                    // setMenuOpenId(null);
                    // if (!confirm("このスレッドを削除します。よろしいですか？")) return;
                    // const res = await fetch(`/api/threads/${t.id}`, { method: "DELETE" });
                    // if (!res.ok) {
                    //   const j = await res.json().catch(() => ({}));
                    //   alert(j?.message || j?.error || "削除に失敗しました");
                    //   return;
                    // }
                    // const updated = await mutate();
                    // if (selectedThreadId === t.id) {
                    //   const nextId =
                    //     Array.isArray(updated) && updated.length ? updated[0].id : null;
                    //   setSelectedThreadId(nextId ?? null);
                    // }
                  }}
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {!isLoading && !error && list.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-500">スレッドはまだありません</div>
      )}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          if (!deleting) setDeleteOpen(nextOpen);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-left">スレッドを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              この操作は取り消せません。スレッド
              {deleteTarget?.title
                ? `「${deleteTarget.title}」`
                : deleteTarget?.id
                ? `(ID:${deleteTarget.id})`
                : ""}
              とそのフレーズは一括削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              autoFocus
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleConfirmDelete}
            >
              {deleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
