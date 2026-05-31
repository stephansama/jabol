import { useEffect } from "react";

const DEFAULT_TITLE = "jabol";
const DEFAULT_DESCRIPTION = "A self-hosted link directory.";
const DEFAULT_FAVICON = "/favicon.svg";
const DEFAULT_APPLE_TOUCH_ICON = "/favicon.png";

type Args = {
  brand?: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  loaded?: boolean;
};

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  if (el.content !== content) el.content = content;
}

function upsertLink(rel: string, href: string, type?: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  if (el.href !== href) el.href = href;
  if (type) el.type = type;
  else el.removeAttribute("type");
}

export function useDocumentBranding(args: Args) {
  const { brand, title, description, favicon, image, loaded = false } = args;

  useEffect(() => {
    if (!loaded) return;
    const next = brand ?? title ?? DEFAULT_TITLE;
    if (document.title !== next) document.title = next;
    upsertMeta(`meta[property='og:title']`, "property", "og:title", next);
    upsertMeta(`meta[name='twitter:title']`, "name", "twitter:title", next);
  }, [loaded, brand, title]);

  useEffect(() => {
    if (!loaded) return;
    const next = description ?? DEFAULT_DESCRIPTION;
    upsertMeta(`meta[name='description']`, "name", "description", next);
    upsertMeta(`meta[property='og:description']`, "property", "og:description", next);
    upsertMeta(`meta[name='twitter:description']`, "name", "twitter:description", next);
  }, [loaded, description]);

  useEffect(() => {
    if (!loaded) return;
    const next = favicon || DEFAULT_FAVICON;
    const isSvg = /\.svg(\?|$)/i.test(next);
    upsertLink("icon", next, isSvg ? "image/svg+xml" : undefined);
    upsertLink("apple-touch-icon", favicon || DEFAULT_APPLE_TOUCH_ICON);
  }, [loaded, favicon]);

  useEffect(() => {
    if (!loaded) return;
    upsertMeta(
      `meta[name='twitter:card']`,
      "name",
      "twitter:card",
      image ? "summary_large_image" : "summary",
    );
    if (image) {
      upsertMeta(`meta[property='og:image']`, "property", "og:image", image);
      upsertMeta(`meta[name='twitter:image']`, "name", "twitter:image", image);
    } else {
      document.head.querySelector(`meta[property='og:image']`)?.remove();
      document.head.querySelector(`meta[name='twitter:image']`)?.remove();
    }
  }, [loaded, image]);
}
