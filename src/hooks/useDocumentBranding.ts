import { useEffect } from "react";

const DEFAULT_TITLE = "jabol";
const DEFAULT_FAVICON = "/favicon.svg";

export function useDocumentBranding(args: { brand?: string; title?: string; favicon?: string }) {
  const { brand, title, favicon } = args;

  useEffect(() => {
    const next = brand ?? title ?? DEFAULT_TITLE;
    if (document.title !== next) document.title = next;
  }, [brand, title]);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    const next = favicon || DEFAULT_FAVICON;
    if (link.href !== next) link.href = next;
    if (favicon) {
      link.removeAttribute("type");
    } else {
      link.type = "image/svg+xml";
    }
  }, [favicon]);
}
