"use client";

import React from "react";
import { zenMaru } from "@/lib/fonts";

type Props = {
  onMenuClick: () => void;
};

export default function AppHeader({ onMenuClick }: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/85 backdrop-blur border-b border-gray-200"
      aria-label="アプリのヘッダー"
    >
      <div className="mx-auto max-w-screen-lg h-full px-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="メニューを開く"
          className="size-9 grid place-items-center rounded-lg hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {/* ハンバーガー */}
          <div className="w-5 space-y-1.5" aria-hidden>
            <span className="block h-0.5 bg-gray-800 rounded"></span>
            <span className="block h-0.5 bg-gray-800 rounded"></span>
            <span className="block h-0.5 bg-gray-800 rounded"></span>
          </div>
        </button>
        <h1 className={`${zenMaru.className} text-lg font-semibold tracking-wide`}>フラたび</h1>
      </div>
    </header>
  );
}
