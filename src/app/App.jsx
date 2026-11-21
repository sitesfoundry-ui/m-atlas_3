import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { IconSprite } from "../components/shell/IconSprite.jsx";
import { MenuSheet } from "../components/shell/MenuSheet.jsx";
import { LocaleProvider } from "../i18n/useLocale.js";
import { RouteTransition } from "./RouteTransition.jsx";
import { AppRoutes } from "./routes.jsx";
import { LightProvider } from "./useLight.js";

function AppShell() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOrigin, setMenuOrigin] = useState(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleOpenMenu = useCallback((triggerEl) => {
    const target = triggerEl || menuButtonRef.current;
    if (target && typeof target.getBoundingClientRect === "function") {
      const rect = target.getBoundingClientRect();
      setMenuOrigin({
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      });
    } else {
      setMenuOrigin(null);
    }
    setMenuOpen(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      menuButtonRef.current?.focus();
    });
  }, []);

  const currentVolume =
    pathname === "/" ? "birds" : pathname === "/myths" ? "myths" : null;

  return (
    <>
      <IconSprite />
      <RouteTransition />
      <AppRoutes onOpenMenu={handleOpenMenu} menuButtonRef={menuButtonRef} />
      <MenuSheet
        open={menuOpen}
        origin={menuOrigin}
        volume={currentVolume}
        onClose={handleCloseMenu}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <LightProvider>
          <AppShell />
        </LightProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}
