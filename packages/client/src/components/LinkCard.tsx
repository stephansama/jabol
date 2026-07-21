import { forwardRef, useEffect, useState, type CSSProperties } from "react";
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
  const [imageError, setImageError] = useState(false);
  const compact = density === "compact";
  const iconSize = compact ? 22 : 36;
  const showHero = !compact && !!link.image && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [link.image]);

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
  const initial = link.name.trim().charAt(0).toUpperCase() || "•";

  const sameTab = !!link.openInSameTab;

  return (
    <a
      ref={ref}
      href={link.url}
      target={sameTab ? "_self" : "_blank"}
      rel={sameTab ? undefined : "noopener noreferrer"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-active={active || undefined}
      className="relative flex w-full cursor-pointer overflow-hidden rounded-sm text-left text-inherit outline-none transition-colors"
      style={style}
    >
      {!compact &&
        (showHero ? (
          <div
            aria-hidden
            className="-mx-3.5 -mt-3.5 aspect-[16/9] overflow-hidden bg-bg-sunken"
          >
            <img
              src={link.image}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="-mx-3.5 -mt-3.5 relative flex aspect-[16/9] items-center justify-center overflow-hidden"
            style={{
              backgroundColor: `color-mix(in srgb, var(--cat-${hue}) 14%, var(--surface-raised))`,
              backgroundImage:
                `radial-gradient(circle at 22% 28%, color-mix(in srgb, var(--cat-${hue}) 32%, transparent), transparent 55%),` +
                `radial-gradient(circle at 78% 70%, color-mix(in srgb, var(--cat-${hue}) 22%, transparent), transparent 50%),` +
                `repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--cat-${hue}) 9%, transparent) 6px 7px)`,
            }}
          >
            <span
              className="select-none font-black leading-none tracking-tight"
              style={{
                fontSize: "clamp(40px, 22%, 88px)",
                color: `color-mix(in srgb, var(--cat-${hue}) 75%, var(--fg))`,
                opacity: 0.65,
                textShadow:
                  "0 1px 0 color-mix(in srgb, var(--bg) 30%, transparent)",
              }}
            >
              {initial}
            </span>
          </div>
        ))}
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
