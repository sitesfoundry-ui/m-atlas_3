import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLight } from "../app/useLight.js";

function destinationBg(pathname, light) {
  if (pathname === "/") {
    return light === "dusk" ? "#14170f" : "#f6f1e7";
  }
  if (pathname === "/myths") {
    return light === "dusk" ? "#17120d" : "#ebe1cd";
  }
  return light === "dusk" ? "#15140e" : "#f1eadc";
}

export function RouteTransition() {
  const { pathname } = useLocation();
  const { light } = useLight();
  const sheetRef = useRef(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    const el = sheetRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    el.style.backgroundColor = destinationBg(pathname, light);

    const anim = el.animate(
      [
        { clipPath: "inset(100% 0 0 0)" },
        { clipPath: "inset(0% 0 0 0)", offset: 0.45 },
        { clipPath: "inset(0% 0 0 0)", offset: 0.55 },
        { clipPath: "inset(0 0 100% 0)" },
      ],
      {
        duration: 600,
        easing: "cubic-bezier(.76,0,.18,1)",
        fill: "none",
      }
    );

    return () => {
      try {
        anim.cancel();
      } catch {
        // Ignore
      }
    };
  }, [pathname, light]);

  return <div ref={sheetRef} className="route-sheet" aria-hidden="true" style={{ clipPath: "inset(100% 0 0 0)" }} />;
}
