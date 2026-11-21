import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AboutPage } from "../pages/AboutPage.jsx";
import { CollectionPage } from "../pages/CollectionPage.jsx";
import { ContactPage } from "../pages/ContactPage.jsx";
import { LegalPage } from "../pages/LegalPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { NotePage } from "../pages/NotePage.jsx";
import { NotesPage } from "../pages/NotesPage.jsx";

const AtlasPage = lazy(() =>
  import("../features/atlas/AtlasPage.jsx").then((m) => ({ default: m.AtlasPage }))
);

export function AppRoutes({ onOpenMenu, menuButtonRef }) {
  const shared = { onOpenMenu, menuButtonRef };

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<AtlasPage volume="birds" {...shared} />} />
        <Route path="/myths" element={<AtlasPage volume="myths" {...shared} />} />
        <Route path="/notes" element={<NotesPage {...shared} />} />
        <Route path="/notes/:slug" element={<NotePage {...shared} />} />
        <Route path="/about" element={<AboutPage {...shared} />} />
        <Route path="/contact" element={<ContactPage {...shared} />} />
        <Route path="/collections/:slug" element={<CollectionPage {...shared} />} />
        <Route path="/legal/:slug" element={<LegalPage {...shared} />} />
        <Route path="*" element={<NotFoundPage {...shared} />} />
      </Routes>
    </Suspense>
  );
}
