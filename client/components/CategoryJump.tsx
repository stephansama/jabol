import type { Category } from "@/lib/types";
import { hueForIndex } from "@/lib/hue";

type Props = {
  categories: Category[];
  admin?: boolean;
};

export function CategoryJump({ categories, admin }: Props) {
  const items = categories
    .map((c, i) => ({
      cat: c,
      hue: hueForIndex(i),
      n: c.links.filter((l) => !l.hidden || admin).length,
    }))
    .filter((x) => x.n > 0);

  if (items.length === 0) return null;

  return (
    <div className="mb-7 flex flex-wrap gap-2">
      {items.map(({ cat, hue, n }) => (
        <a
          key={cat.id}
          href={`#cat-${cat.id}`}
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById(`cat-${cat.id}`);
            if (el) {
              const r = el.getBoundingClientRect();
              window.scrollBy({ top: r.top - 84, behavior: "smooth" });
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-[5px] text-sm text-fg-muted no-underline hover:border-border-strong"
        >
          <span
            aria-hidden
            className="h-[7px] w-[7px] rounded-sm"
            style={{ background: `var(--cat-${hue})` }}
          />
          {cat.name}
          <span className="tabular mono-dim text-[11px]">{n}</span>
        </a>
      ))}
    </div>
  );
}
