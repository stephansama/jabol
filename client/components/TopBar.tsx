import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  brand?: string;
  title?: string;
  favicon?: string;
  headerHtml?: string;
  center?: ReactNode;
  right?: ReactNode;
};

export function TopBar({ brand, title, favicon, headerHtml, center, right }: Props) {
  const wordmark = brand?.trim() || "jabol";
  const logo = favicon?.trim() || "/favicon.svg";
  const customHtml = headerHtml?.trim();
  const linkClass =
    "flex min-w-0 items-center gap-2.5 justify-self-start text-fg no-underline hover:text-fg";
  return (
    <header
      className="sticky top-0 z-50 border-b border-border backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--bg) 86%, transparent)" }}
    >
      <div className="mx-auto grid min-h-[68px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3">
        {customHtml ? (
          <div
            className="flex min-w-0 items-center gap-2.5 justify-self-start"
            dangerouslySetInnerHTML={{ __html: customHtml }}
          />
        ) : (
          <Link to="/" className={linkClass}>
            <img
              src={logo}
              alt=""
              aria-hidden
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            <span className="truncate text-base font-semibold">{wordmark}</span>
            {title && (
              <span className="mono-dim truncate text-sm">/ {title}</span>
            )}
          </Link>
        )}
        <div className="w-full min-w-0 max-w-[640px] justify-self-center">
          {center}
        </div>
        <div className="flex items-center gap-3 justify-self-end">{right}</div>
      </div>
    </header>
  );
}
