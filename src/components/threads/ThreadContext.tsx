"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ThreadSelection = {
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;
};

const Ctx = createContext<ThreadSelection | undefined>(undefined);

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const value = useMemo(() => ({ selectedThreadId, setSelectedThreadId }), [selectedThreadId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThreadSelection() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useThreadSelection must be used within <ThreadProvider>");
  return v;
}

