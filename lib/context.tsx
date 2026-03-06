"use client";

import { createContext, useContext } from "react";

const IsV0Context = createContext(false);

export function IsV0Provider({
  children,
  value = false,
}: {
  children: React.ReactNode;
  value?: boolean;
}) {
  return <IsV0Context.Provider value={value}>{children}</IsV0Context.Provider>;
}

export function useIsV0(): boolean {
  return useContext(IsV0Context);
}
