import { useCallback, useRef } from "react";

export type ShellFormHandlers = {
  save: () => Promise<boolean>;
  cancel: () => void;
  /** Reset draft when shell enters edit mode (optional). */
  beginEdit?: () => void;
};

/** Wires shell Edit/Save/Cancel buttons to the active tab form via Outlet context. */
export function useShellFormBridge() {
  const handlersRef = useRef<ShellFormHandlers | null>(null);

  const registerHandlers = useCallback((handlers: ShellFormHandlers | null) => {
    handlersRef.current = handlers;
  }, []);

  const runBeginEdit = useCallback(() => {
    handlersRef.current?.beginEdit?.();
  }, []);

  const runSave = useCallback(async () => {
    return (await handlersRef.current?.save()) ?? false;
  }, []);

  const runCancel = useCallback(() => {
    handlersRef.current?.cancel();
  }, []);

  return { registerHandlers, runBeginEdit, runSave, runCancel };
}
