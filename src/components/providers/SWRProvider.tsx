"use client";

import React from "react";
import { SWRConfig } from "swr";

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}

