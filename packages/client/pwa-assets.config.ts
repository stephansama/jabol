import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

// PWA icon assets are generated from the canonical SVG favicon into `assets/`
// (Vite's publicDir), so they are copied to the build root and served at `/`.
// Regenerate with: `pnpm assets:generate`.
export default defineConfig({
  preset,
  images: ["../../assets/favicon.svg"],
});
