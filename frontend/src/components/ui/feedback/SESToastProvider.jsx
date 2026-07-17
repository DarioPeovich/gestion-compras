import { useCallback, useEffect, useRef, useState } from "react";

import SESToast from "./SESToast";
import SESToastContext from "./sesToastContext";

const DEFAULT_DURATION = 4500;

export default function SESToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const counterRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef.current;

    return () => {
      mountedRef.current = false;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);

    if (mountedRef.current) {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }
  }, []);

  const showToast = useCallback(
    ({ type = "info", message, duration = DEFAULT_DURATION }) => {
      const id = `${Date.now()}-${++counterRef.current}`;
      setToasts((current) => [...current, { id, type, message }]);

      if (duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <SESToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed right-4 top-24 z-[1000] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <SESToast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </SESToastContext.Provider>
  );
}
