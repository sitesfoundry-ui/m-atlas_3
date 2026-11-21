# Assets & Media Quality

> **Honest limit:** A rendered pixel cannot exceed the source file. To get a sharper image, model, or footer clip, re-export or regenerate the source at a higher resolution (or upscale the image with an AI upscaler) and drop it into `assets-src/`.

## Source inventory

Run `npm run media:probe -- --write` on a machine with network access to populate exact measurements from the remote files.

| Asset | Type | Source dimensions / specs | File size | Notes |
|---|---|---|---|---|
| `hoopoe` image | PNG | Remote CloudFront | — | Cut-out transparent PNG |
| `hoopoe` model | GLB | Remote CloudFront | — | 3D specimen |
| `kingfisher` image | PNG | Remote CloudFront | — | Cut-out transparent PNG |
| `kingfisher` model | GLB | Remote CloudFront | — | 3D specimen |
| `phoenix` image | PNG / WebP | Remote Higgs / CloudFront | — | `w=320` thumb, `w=1600` full |
| `phoenix` model | GLB | Remote CloudFront | ≈ 72 MB | Heavy textures; `-m` mobile variant caps at 2048 px |
| `kraken` image | PNG / WebP | Remote Higgs / CloudFront | — | `w=320` thumb, `w=1600` full |
| `kraken` model | GLB | Remote CloudFront | ≈ 60 MB | Heavy textures; `-m` mobile variant caps at 2048 px |
| `footer` clip (`scene.mp4`) | MP4 / WebM | 1280 × 720, 60 fps, 4.25 s, muted | — | Hard loop; upscaled slightly on ≥ 1920 px retina screens until a higher-res source is supplied |
| `footer` poster (`poster.jpg`) | JPG / WebP | 1280 × 720 | — | First frame of `scene.mp4` |

## Replacing assets for `local` mode

1. Place source files in `assets-src/` (git-ignored):
   - `assets-src/images/{id}.png` (`hoopoe`, `kingfisher`, `phoenix`, `kraken`)
   - `assets-src/models/{id}.glb`
   - `assets-src/footer/scene.mp4` and `assets-src/footer/poster.jpg`
2. Run the optimisation scripts:
   - `npm run media:images` → writes `public/media/images/{id}-320.webp`, `-1600.webp`, `-2400.webp`, and `{id}.png`
   - `npm run media:models` → writes `public/models/{id}.glb` (4096 px max) and `{id}-m.glb` (2048 px max) using Meshopt + WebP without simplifying geometry (`--simplify false`)
   - `npm run media:footer` → writes `public/media/footer/scene.mp4`, `scene.webm`, and `poster.webp` at 1280 × 720, 60 fps, 4.25 s
3. Bump `ASSET_VERSION` in `src/content/assets.js` to bust caches.
4. Set `VITE_ASSET_MODE=local` in your build environment and run `npm run build`.
