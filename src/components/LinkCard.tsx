import { forwardRef, useState, type CSSProperties } from "react";
import { Icon } from "./Icon";
import type { Link } from "@/lib/types";
import type { Hue } from "@/lib/hue";
import type { Density } from "@/hooks/useDensity";

type Props = {
  link: Link;
  hue?: Hue;
  active?: boolean;
  admin?: boolean;
  density?: Density;
  onTagClick?: (tag: string) => void;
  activeTag?: string;
};

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

export const LinkCard = forwardRef<HTMLAnchorElement, Props>(function LinkCard(
  { link, hue = "red", active, admin, density = "comfortable", onTagClick, activeTag },
  ref,
) {
  const [hover, setHover] = useState(false);
  const compact = density === "compact";
  const iconSize = compact ? 22 : 36;

  const borderColor = active
    ? "var(--accent)"
    : hover
      ? "var(--border-strong)"
      : "var(--border)";

  const style: CSSProperties = {
    background: hover && !active ? "var(--surface-hover)" : "var(--surface)",
    border: `1px solid ${borderColor}`,
    boxShadow: active ? "0 0 0 2px var(--focus-ring)" : undefined,
    flexDirection: compact ? "row" : "column",
    alignItems: compact ? "center" : "stretch",
    gap: compact ? 10 : 12,
    padding: compact ? "9px 12px" : 14,
  };

  const otherTags = (link.tags ?? []).filter((t) => t !== "critical").slice(0, 4);
  const showCritical = !compact && (link.tags ?? []).includes("critical");

  return (
    <a
      ref={ref}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-active={active || undefined}
      className="relative flex w-full cursor-pointer overflow-hidden rounded-sm text-left text-inherit outline-none transition-colors"
      style={style}
    >
      <div
        className="flex items-center justify-between"
        style={{ width: compact ? "auto" : "100%" }}
      >
        <Icon
          icon={link.icon}
          name={link.name}
          url={link.url}
          hue={hue}
          size={iconSize}
        />
        {!compact && (
          <span
            aria-hidden
            className="text-fg-subtle transition-opacity"
            style={{ opacity: hover ? 1 : 0, fontSize: 13 }}
          >
            ↗
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="truncate font-semibold text-fg"
            style={{ fontSize: compact ? "0.8125rem" : "0.9375rem" }}
          >
            {link.name}
          </span>
          {admin && link.hidden && (
            <span className="label-upper inline-flex items-center gap-1 rounded-sm bg-surface-raised px-1.5 py-0.5 text-[10px] text-warning">
              <span aria-hidden>🔒</span> hidden
            </span>
          )}
          {showCritical && (
            <span className="label-upper inline-flex items-center gap-1 rounded-sm bg-surface-raised px-1.5 py-0.5 text-[10px] text-danger">
              critical
            </span>
          )}
        </div>

        {!compact && link.description && (
          <p
            className="mt-1.5 text-[0.8125rem] leading-snug text-fg-subtle"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {link.description}
          </p>
        )}

        {!compact && otherTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {otherTags.map((t) => {
              const isActive = activeTag === t;
              const className = isActive
                ? "inline-flex items-center rounded-full border border-accent bg-accent/10 px-2 py-px text-[11px] text-accent"
                : "inline-flex items-center rounded-full border border-border bg-transparent px-2 py-px text-[11px] text-fg-subtle";
              if (!onTagClick) {
                return (
                  <span key={t} className={className}>
                    #{t}
                  </span>
                );
              }
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={isActive}
                  title={isActive ? `clear filter: #${t}` : `filter by #${t}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTagClick(t);
                  }}
                  className={`${className} cursor-pointer transition-colors hover:border-border-strong hover:text-fg`}
                >
                  #{t}
                </button>
              );
            })}
          </div>
        )}

        {compact && (
          <span className="mono-dim mt-px block truncate text-[11px]">
            {prettyUrl(link.url)}
          </span>
        )}
      </div>

      {compact && admin && link.hidden && (
        <span className="label-upper rounded-sm bg-surface-raised px-1.5 py-0.5 text-[10px] text-warning">
          🔒
        </span>
      )}
    </a>
  );
});
