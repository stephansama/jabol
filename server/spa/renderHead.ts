export const SENTINEL_START = "<!--jabol:head:start-->";
export const SENTINEL_END = "<!--jabol:head:end-->";

export const DEFAULT_TITLE = "jabol";
export const DEFAULT_DESCRIPTION = "A self-hosted link directory.";
export const DEFAULT_FAVICON = "/favicon.svg";
export const DEFAULT_APPLE_TOUCH_ICON = "/favicon.png";

export type HeadInput = {
  brand?: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  siteUrl?: string;
  bootstrap?: unknown;
};

export const BOOTSTRAP_SCRIPT_ID = "jabol-initial";

export function computeDocumentTitle(input: Pick<HeadInput, "brand" | "title">): string {
  return input.brand ?? input.title ?? DEFAULT_TITLE;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSvg(href: string): boolean {
  return /\.svg(\?|$)/i.test(href);
}

export function renderBootstrapScript(bootstrap: unknown): string {
  const json = JSON.stringify(bootstrap).replace(/</g, "\\u003c");
  return `<script id="${BOOTSTRAP_SCRIPT_ID}" type="application/json">${json}</script>`;
}

export function renderHeadBlock(input: HeadInput): string {
  const title = computeDocumentTitle(input);
  const description = input.description ?? DEFAULT_DESCRIPTION;
  const favicon = input.favicon ?? DEFAULT_FAVICON;
  const appleTouchIcon = input.favicon ?? DEFAULT_APPLE_TOUCH_ICON;
  const image = input.image;
  const siteUrl = input.siteUrl;

  const faviconTypeAttr = isSvg(favicon) ? ' type="image/svg+xml"' : "";

  const lines: string[] = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="icon"${faviconTypeAttr} href="${esc(favicon)}" />`,
    `<link rel="apple-touch-icon" href="${esc(appleTouchIcon)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
  ];

  if (siteUrl) lines.push(`<meta property="og:url" content="${esc(siteUrl)}" />`);
  if (image) lines.push(`<meta property="og:image" content="${esc(image)}" />`);

  lines.push(
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  );

  if (image) lines.push(`<meta name="twitter:image" content="${esc(image)}" />`);

  if (input.bootstrap !== undefined) {
    lines.push(renderBootstrapScript(input.bootstrap));
  }

  return `${SENTINEL_START}\n    ${lines.join("\n    ")}\n    ${SENTINEL_END}`;
}

export function renderIndexHtml(template: string, input: HeadInput): string {
  const startIdx = template.indexOf(SENTINEL_START);
  const endIdx = template.indexOf(SENTINEL_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return template;
  const block = renderHeadBlock(input);
  return template.slice(0, startIdx) + block + template.slice(endIdx + SENTINEL_END.length);
}
