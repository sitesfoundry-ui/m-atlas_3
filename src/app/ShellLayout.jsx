import { useEffect } from "react";
import { useLocale } from "../i18n/useLocale.js";
import { BigFooter } from "../components/shell/BigFooter.jsx";
import { SiteBar } from "../components/shell/SiteBar.jsx";
import { useLight } from "./useLight.js";

export function ShellLayout({ children, onOpenMenu, menuButtonRef, accentColor = null }) {
  const { strings } = useLocale();
  const { light } = useLight();

  useEffect(() => {
    document.body.classList.remove("viewer-active");
    document.body.style.backgroundColor = light === "dusk" ? "#15140e" : "#f1eadc";
  }, [light]);

  const style = accentColor ? { "--accent": accentColor } : undefined;

  return (
    <div className="site" data-light={light} style={style}>
      <a className="skip-link" href="#main">
        {strings.nav.skip}
      </a>
      <SiteBar onOpenMenu={onOpenMenu} menuButtonRef={menuButtonRef} />
      <main id="main" className="page-main">
        {children}
      </main>
      <BigFooter />
    </div>
  );
}
