import { useContext } from "react";

import SESToastContext from "./sesToastContext";

export default function useSESToast() {
  const context = useContext(SESToastContext);

  if (!context) {
    throw new Error("useSESToast debe utilizarse dentro de SESToastProvider");
  }

  return context;
}
