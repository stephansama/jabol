import { z } from "zod";

export const themeSchema = z
  .enum(["light", "dark", "mocha", "latte", "system", "system-catppuccin"])
  .describe(
    "Theme preference applied to every visitor. 'system' follows prefers-color-scheme as light/dark; 'system-catppuccin' follows it as latte/mocha.",
  );

const linkBaseSchema = z.object({
  id: z.uuid().optional().describe("Stable UUID. Added automatically on first read if absent."),
  name: z.string().min(1).describe("Display name."),
  url: z.url().describe("Target URL (http/https)."),
  description: z.string().optional().describe("Shown under the name."),
  icon: z
    .string()
    .optional()
    .describe("Iconify id (e.g. \"mdi:github\") or absolute URL. If absent, jabol fetches the page favicon."),
  image: z
    .string()
    .min(1)
    .optional()
    .describe(
      "OG image override. Accepts an absolute URL or a /api/icons/... path from the enrichment cache. If absent, jabol fetches og:image.",
    ),
  tags: z.array(z.string()).optional().describe("Searched and shown as pills."),
  hidden: z.boolean().optional().describe("If true, only authenticated admins see this link."),
  openInSameTab: z
    .boolean()
    .optional()
    .describe("If true, open the link in the current tab. Default opens in a new tab."),
});

const categorySchema = z.object({
  id: z.uuid().optional().describe("Stable UUID. Added automatically on first read if absent."),
  name: z.string().min(1).describe("Category name shown as a section header."),
  icon: z.string().optional().describe("Optional Iconify id or URL shown beside the category name."),
  hidden: z
    .boolean()
    .optional()
    .describe("If true, only authenticated admins see this category and every link inside it."),
  links: z.array(linkBaseSchema).default([]),
});

const schemaRefField = z
  .url()
  .optional()
  .describe("Optional JSON Schema URL for editor autocomplete; ignored by the app.");

const brandField = z
  .string()
  .min(1)
  .max(80)
  .optional()
  .describe("Organization name / wordmark shown in the top bar and used as the browser tab title.");

const faviconField = z
  .string()
  .min(1)
  .optional()
  .describe(
    "Favicon for the browser tab and top bar. Usually a /api/icons/... path produced by the favicon upload endpoint, but may also be an absolute URL.",
  );

const imageField = z
  .string()
  .min(1)
  .optional()
  .describe(
    "Open Graph / Twitter card image used when the site is shared on social platforms. Absolute URL or /api/icons/... path. Recommended size: 1200×630.",
  );

export const categorizedInputSchema = z.object({
  $schema: schemaRefField,
  brand: brandField,
  title: z.string().optional().describe("Collection title shown as a sub-label beside the brand."),
  description: z.string().optional().describe("Page description / meta."),
  favicon: faviconField,
  image: imageField,
  theme: themeSchema.optional(),
  categories: z.array(categorySchema).min(1).describe("Ordered list of categories."),
});

export const flatInputSchema = z.object({
  $schema: schemaRefField,
  brand: brandField,
  title: z.string().optional().describe("Collection title shown as a sub-label beside the brand."),
  description: z.string().optional().describe("Page description / meta."),
  favicon: faviconField,
  image: imageField,
  theme: themeSchema.optional(),
  groupByTag: z
    .boolean()
    .optional()
    .describe("If true, links are bucketed into synthetic categories by their first tag."),
  links: z.array(linkBaseSchema).min(1).describe("Flat list of links."),
});

export const inputSchema = z.union([categorizedInputSchema, flatInputSchema]);

export type LinkInput = z.infer<typeof linkBaseSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CategorizedInput = z.infer<typeof categorizedInputSchema>;
export type FlatInput = z.infer<typeof flatInputSchema>;
export type Input = z.infer<typeof inputSchema>;
