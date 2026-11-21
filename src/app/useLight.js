import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";

const LightContext = createContext(null);

function readInitialLight() {
  if (typeof window === "undefined") return "day";
  try {
    const saved = localStorage.getItem("matlas.light");
    if (saved === "dusk" || saved === "day") return saved;
  } catch {
    return "day";
  }
  return "day";
}

export function LightProvider({ children }) {
  const [light, setLightState] = useState(readInitialLight);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-light", light);
    }
    try {
      localStorage.setItem("matlas.light", light);
    } catch {
      // Storage unavailable
    }
  }, [light]);

  const setLight = useCallback((next) => {
    if (next !== "day" && next !== "dusk") return;
    setLightState(next);
  }, []);

  const toggleLight = useCallback(() => {
    setLightState((prev) => (prev === "dusk" ? "day" : "dusk"));
  }, []);

  return createElement(
    LightContext.Provider,
    { value: { light, setLight, toggleLight } },
    children
  );
}

export function useLight() {
  const ctx = useContext(LightContext);
  if (!ctx) throw new Error("useLight must be used inside LightProvider");
  return ctx;
}
