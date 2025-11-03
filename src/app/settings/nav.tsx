"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/settings", label: "設定" },
  { href: "/settings/privacy", label: "プライバシーポリシー" },
  { href: "/settings/terms", label: "利用規約" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
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
    </nav>
  );
}
