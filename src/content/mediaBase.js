// Public address of the media repository that holds the .glb models and the cut-out images.
// The owner sets VITE_MEDIA_BASE in the environment; the literal below is the fallback.
export const MEDIA_BASE =
  import.meta.env?.VITE_MEDIA_BASE ||
  (typeof process !== "undefined" ? process.env?.VITE_MEDIA_BASE : undefined) ||
  "{{MEDIA_BASE}}";
