import { useEffect } from "react";

export function useNoIndex() {
  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    if (existing) {
      const prev = existing.getAttribute("content");
      existing.setAttribute("content", "noindex,follow");
      return () => {
        if (prev === null) {
          existing.remove();
        } else {
          existing.setAttribute("content", prev);
        }
      };
    }

    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex,follow");
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);
}
