"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

import {
  createDialogQueueState,
  dialogQueueReducer,
  selectNextDialogId,
  type DialogQueueId,
} from "@/lib/dialog-queue";

const DIALOG_QUEUE_SETTLE_MS = 250;

type DialogQueueContextValue = {
  activeId?: DialogQueueId;
  register: (id: DialogQueueId, priority: number) => () => void;
  complete: (id: DialogQueueId) => void;
};

const DialogQueueContext = createContext<DialogQueueContextValue | null>(null);

export function DialogQueueProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [state, dispatch] = useReducer(
    dialogQueueReducer,
    undefined,
    createDialogQueueState,
  );

  const register = useCallback((id: DialogQueueId, priority: number) => {
    dispatch({ type: "register", id, priority });
    return () => dispatch({ type: "unregister", id });
  }, []);

  const complete = useCallback((id: DialogQueueId) => {
    dispatch({ type: "complete", id });
  }, []);

  const hasWaitingDialog = Boolean(
    selectNextDialogId(state.entries, state.completed),
  );

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const timeout = window.setTimeout(() => {
      dispatch({ type: "navigation-stable" });
    }, DIALOG_QUEUE_SETTLE_MS);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    if (state.activeId || state.waitingForNavigation || !hasWaitingDialog) {
      return;
    }

    // Route transitions and dialog exit animations can both update eligibility.
    // Restarting this timer on pathname or registration changes ensures the next
    // prompt is selected from the stable post-navigation state.
    const timeout = window.setTimeout(() => {
      dispatch({ type: "activate-next" });
    }, DIALOG_QUEUE_SETTLE_MS);

    return () => window.clearTimeout(timeout);
  }, [hasWaitingDialog, pathname, state.activeId, state.entries, state.waitingForNavigation]);

  return (
    <DialogQueueContext.Provider value={{ activeId: state.activeId, register, complete }}>
      {children}
    </DialogQueueContext.Provider>
  );
}

export function useQueuedDialog(
  id: DialogQueueId,
  priority: number,
  enabled = true,
) {
  const queue = useContext(DialogQueueContext);
  if (!queue) {
    throw new Error("useQueuedDialog must be used inside DialogQueueProvider");
  }
  const { activeId, register, complete } = queue;

  useEffect(() => {
    if (!enabled) return;
    return register(id, priority);
  }, [enabled, id, priority, register]);

  return {
    open: enabled && activeId === id,
    complete: () => complete(id),
  };
}
