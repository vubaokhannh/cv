"use client";

import { createContext, useContext } from "react";

export interface WorkspaceActions {
  showToast: (message: string) => void;
  copyEmail: () => void;
}

export const WorkspaceContext = createContext<WorkspaceActions | null>(null);

/** Toast + clipboard actions provided by the workspace shell to every view. */
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used inside the workspace shell");
  return ctx;
}
