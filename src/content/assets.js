export const ASSET_VERSION = "1";

const mode =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_ASSET_MODE) ||
  (typeof process !== "undefined" && process.env && process.env.VITE_ASSET_MODE) ||
  "remote";

export const assetMode = mode === "local" ? "local" : "remote";

function buildHiggsUrl(rawUrl, width, quality) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === "images.higgs.ai") {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      return parsed.toString();
    }
    if (parsed.hostname === "d8j0ntlcm91z4.cloudfront.net") {
      return `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(rawUrl)}&w=${width}&q=${quality}`;
    }
  } catch {
    return rawUrl;
  }
  return rawUrl;
}

export function isMobileGpuTarget() {
  if (typeof window === "undefined") return false;
  const smallViewport = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  const lowMemory = typeof navigator !== "undefined" && typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
  return Boolean(smallViewport || lowMemory);
}

export function isDeviceGated() {
  if (assetMode !== "remote" || typeof window === "undefined") return false;
  if (isMobileGpuTarget()) return true;
  const conn = typeof navigator !== "undefined" ? navigator.connection : null;
  if (conn) {
    if (conn.saveData) return true;
    if (conn.effectiveType && ["slow-2g", "2g", "3g"].includes(conn.effectiveType)) {
      return true;
    }
  }
  return false;
}

export function canPrefetchNext() {
  if (typeof window === "undefined") return false;
  if (isDeviceGated()) return false;
  const mem = typeof navigator !== "undefined" ? navigator.deviceMemory : undefined;
  if (typeof mem === "number" && mem < 8) return false;
  return true;
}

export function imageUrl(specimen, variant = "thumb", dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1) {
  if (assetMode === "local") {
    if (variant === "full") {
      const size = dpr >= 2.5 ? 2400 : 1600;
      return `/media/images/${specimen.id}-${size}.webp?v=${ASSET_VERSION}`;
    }
    return `/media/images/${specimen.id}-320.webp?v=${ASSET_VERSION}`;
  }
  return variant === "full"
    ? buildHiggsUrl(specimen.image, 1600, 90)
    : buildHiggsUrl(specimen.image, 320, 85);
}

export function imageFallbackUrl(specimen) {
  if (assetMode === "local") {
    return `/media/images/${specimen.id}.png?v=${ASSET_VERSION}`;
  }
  return specimen.image;
}

export function modelUrl(specimen) {
  if (assetMode === "local") {
    const suffix = isMobileGpuTarget() ? "-m" : "";
    return `/models/${specimen.id}${suffix}.glb?v=${ASSET_VERSION}`;
  }
  return specimen.model;
}

const REMOTE_FOOTER_VIDEO =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/175fbbcd-e50a-480c-bab2-ca16d4678322.mp4";
const REMOTE_FOOTER_POSTER =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/726b168c-da47-4682-a255-cc3e02f89bae.jpg";

export function footerMedia() {
  if (assetMode === "local") {
    return {
      mode: "local",
      poster: `/media/footer/poster.webp?v=${ASSET_VERSION}`,
      sources: [
        { src: `/media/footer/scene.webm?v=${ASSET_VERSION}`, type: "video/webm" },
        { src: `/media/footer/scene.mp4?v=${ASSET_VERSION}`, type: "video/mp4" },
      ],
    };
  }
  return {
    mode: "remote",
    poster: REMOTE_FOOTER_POSTER,
    sources: [{ src: REMOTE_FOOTER_VIDEO, type: "video/mp4" }],
  };
}
