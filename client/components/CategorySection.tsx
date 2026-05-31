import { ChevronDown } from "lucide-react";
import { Icon } from "./Icon";
import { LinkCard } from "./LinkCard";
import type { Category, Link } from "@/lib/types";
import type { Hue } from "@/lib/hue";
import type { Density } from "@/hooks/useDensity";

type Props = {
  category: Category;
  hue: Hue;
  admin?: boolean;
  density?: Density;
  activeLinkId?: string | null;
  collapsed?: boolean;
  onToggle?: () => void;
  registerRef?: (link: Link, node: HTMLAnchorElement | null) => void;
  onTagClick?: (tag: string) => void;
  activeTag?: string;
};

export function CategorySection({
  category,
  hue,
  admin,
  density = "comfortable",
  activeLinkId,
  collapsed = false,
  onToggle,
  registerRef,
  onTagClick,
  activeTag,
}: Props) {
  const minCol = density === "compact" ? 216 : 260;
  const gridId = `cat-${category.id}-grid`;
  return (
    <section
      id={`cat-${category.id}`}
      className="mb-12"
      style={{ scrollMarginTop: 96 }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={gridId}
        className="-mx-2 mb-4 flex w-full cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-transparent px-2 py-1 text-left appearance-none hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown
          aria-hidden
          className="h-4 w-4 shrink-0 text-fg-subtle transition-transform"
          style={{ transform: collapsed ? "rotate(-90deg)" : "none" }}
        />
        <span
          aria-hidden
          className="block h-[18px] w-1 rounded-sm"
          style={{ background: `var(--cat-${hue})` }}
        />
        {category.icon ? (
          <Icon
            icon={category.icon}
            name={category.name}
            hue={hue}
            size={20}
            radius="2px"
          />
        ) : null}
        <h2 className="m-0 text-base font-semibold tracking-tight text-fg">
          {category.name}
        </h2>
        {admin && category.hidden && (
          <span className="label-upper inline-flex items-center gap-1 rounded-sm bg-surface-raised px-1.5 py-0.5 text-[10px] text-warning">
            <span aria-hidden>🔒</span> hidden
          </span>
        )}
        <span
          className="label-upper tabular rounded-full px-2 py-px"
          style={{
            color: `var(--cat-${hue})`,
            background: `color-mix(in srgb, var(--cat-${hue}) 12%, transparent)`,
            fontSize: 10.5,
          }}
        >
          {category.links.length}
        </span>
        <span aria-hidden className="ml-1 h-px flex-1 bg-border" />
      </button>
      {!collapsed && (
        <div
          id={gridId}
          className="grid"
          style={{
            gap: density === "compact" ? 8 : 12,
            gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
          }}
        >
          {category.links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              hue={hue}
              admin={admin}
              density={density}
              active={activeLinkId === link.id}
              onTagClick={onTagClick}
              activeTag={activeTag}
              ref={(node) => registerRef?.(link, node)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
