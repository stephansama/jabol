export const SENTINEL_START = "<!--jabol:head:start-->";
export const SENTINEL_END = "<!--jabol:head:end-->";
export const BODY_SENTINEL_START = "<!--jabol:body:start-->";
export const BODY_SENTINEL_END = "<!--jabol:body:end-->";

export const DEFAULT_TITLE = "jabol";
export const DEFAULT_DESCRIPTION = "A self-hosted link directory.";
export const DEFAULT_FAVICON = "/favicon.svg";
export const DEFAULT_APPLE_TOUCH_ICON = "/apple-touch-icon-180x180.png";

export type HeadInput = {
  brand?: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  siteUrl?: string;
  headHtml?: string;
  bodyHtml?: string;
  bootstrap?: unknown;
};

export const BOOTSTRAP_SCRIPT_ID = "jabol-initial";

export function computeDocumentTitle(input: Pick<HeadInput, "brand" | "title">): string {
  // Treat empty strings as unset so a blank brand/title falls through to the default.
  return input.brand || input.title || DEFAULT_TITLE;
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
  const favicon = input.favicon || DEFAULT_FAVICON;
  // apple-touch-icon must be a raster image (iOS ignores SVG for home-screen
  // icons), so fall back to the generated PNG when the favicon is an SVG.
  const appleTouchIcon =
    input.favicon && !isSvg(input.favicon)
      ? input.favicon
      : DEFAULT_APPLE_TOUCH_ICON;
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

  // Admin-supplied custom head HTML — injected verbatim. Only admins can set this
  // (PATCH /api/settings requires auth), and the explicit use case is letting the
  // operator drop in <script> / <meta> / <link> tags (analytics, font preloads,
  // CSP meta, etc.). Escaping would defeat the purpose.
  if (input.headHtml) lines.push(input.headHtml);

  if (input.bootstrap !== undefined) {
    lines.push(renderBootstrapScript(input.bootstrap));
  }

  return `${SENTINEL_START}\n    ${lines.join("\n    ")}\n    ${SENTINEL_END}`;
}

export function renderBodyBlock(input: HeadInput): string {
  // Admin-supplied custom body HTML — injected verbatim at the top of <body>.
  // Same trust model as headHtml: only admins can set it.
  return `${BODY_SENTINEL_START}${input.bodyHtml ?? ""}${BODY_SENTINEL_END}`;
}

export function renderIndexHtml(template: string, input: HeadInput): string {
  let out = template;
  const headStart = out.indexOf(SENTINEL_START);
  const headEnd = out.indexOf(SENTINEL_END);
  if (headStart !== -1 && headEnd !== -1 && headEnd >= headStart) {
    const block = renderHeadBlock(input);
    out = out.slice(0, headStart) + block + out.slice(headEnd + SENTINEL_END.length);
  }
  const bodyStart = out.indexOf(BODY_SENTINEL_START);
  const bodyEnd = out.indexOf(BODY_SENTINEL_END);
  if (bodyStart !== -1 && bodyEnd !== -1 && bodyEnd >= bodyStart) {
    const block = renderBodyBlock(input);
    out = out.slice(0, bodyStart) + block + out.slice(bodyEnd + BODY_SENTINEL_END.length);
  }
  return out;
}
