import { categories } from "../src/content/categories.js";
import { notes } from "../src/content/notes.js";

const EXACT_ROUTES = new Set([
  "/",
  "/myths",
  "/notes",
  "/about",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
]);

const NOTE_SLUGS = new Set(notes.map((n) => n.slug));
const COLLECTION_SLUGS = new Set(
  [...(categories.birds || []), ...(categories.myths || [])].map((c) => c.slug)
);

/**
 * Checks whether a URL pathname matches an active application route.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isKnownRoute(pathname) {
  if (typeof pathname !== "string") return false;
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (EXACT_ROUTES.has(clean)) return true;

  if (clean.startsWith("/notes/")) {
    const slug = clean.slice("/notes/".length);
    return !slug.includes("/") && NOTE_SLUGS.has(slug);
  }

  if (clean.startsWith("/collections/")) {
    const slug = clean.slice("/collections/".length);
    return !slug.includes("/") && COLLECTION_SLUGS.has(slug);
  }

  return false;
}
