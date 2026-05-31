import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";

const docs = await getCollection("docs");

const pages = Object.fromEntries(
  docs.map((page) => [page.id, { data: page.data }]),
);

// Catppuccin Mocha palette — matches the SPA's dark theme.
const base    = [30, 30, 46] as [number, number, number];   // #1e1e2e
const surface = [49, 50, 68] as [number, number, number];   // #313244
const text    = [205, 214, 244] as [number, number, number]; // #cdd6f4
const subtext = [186, 194, 222] as [number, number, number]; // #bac2de
const mauve   = [203, 166, 247] as [number, number, number]; // #cba6f7

export const { getStaticPaths, GET } = await OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (_path, page: (typeof pages)[string]) => ({
    title: page.data.title,
    description: page.data.description ?? "",
    bgGradient: [base, surface],
    border: { color: mauve, width: 12, side: "inline-start" },
    logo: { path: "../assets/favicon.png", size: [256, 256] },
    padding: 80,
    font: {
      title: { size: 72, color: text, weight: "Bold", lineHeight: 1.1 },
      description: { size: 28, color: subtext, lineHeight: 1.4 },
    },
  }),
});
