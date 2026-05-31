import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useLinks } from "@/hooks/useLinks";
import { useFuzzySearch, type FlatLink } from "@/hooks/useFuzzySearch";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useLinksSSE } from "@/hooks/useLinksSSE";
import { useSession } from "@/hooks/useSession";
import { useDensity } from "@/hooks/useDensity";
import { useCollapsedCategories } from "@/hooks/useCollapsedCategories";
import { useDocumentBranding } from "@/hooks/useDocumentBranding";
import { hueForIndex } from "@/lib/hue";
import { TopBar } from "@/components/TopBar";
import { AdminChip } from "@/components/AdminMenu";
import { SearchBar } from "@/components/SearchBar";
import { CategorySection } from "@/components/CategorySection";
import { CategoryJump } from "@/components/CategoryJump";
import { DensityToggle } from "@/components/DensityToggle";
import { LinkCard } from "@/components/LinkCard";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { Footer } from "@/components/Footer";
import { EmptyLibrary, NoResults } from "@/components/EmptyStates";

export function Home() {
  const { user } = useSession();
  const admin = !!user;
  const { data, error, loading, reload } = useLinks(admin);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { density, setDensity } = useDensity();
  const { toggle: toggleCollapsed, isCollapsed } = useCollapsedCategories();

  useEffect(() => {
    if (mobileSearchOpen) searchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  useLinksSSE(reload);

  const allCategories = data?.categories ?? [];

  const filteredCategories = useMemo(() => {
    if (!activeTag) return allCategories;
    return allCategories
      .map((c) => ({ ...c, links: c.links.filter((l) => l.tags?.includes(activeTag)) }))
      .filter((c) => c.links.length > 0);
  }, [allCategories, activeTag]);

  // Auto-clear an active tag if no remaining link still uses it (e.g. after an SSE-driven update).
  useEffect(() => {
    if (!activeTag) return;
    const exists = allCategories.some((c) => c.links.some((l) => l.tags?.includes(activeTag)));
    if (!exists) setActiveTag(null);
  }, [allCategories, activeTag]);

  const onTagClick = useCallback(
    (tag: string) => setActiveTag((cur) => (cur === tag ? null : tag)),
    [],
  );

  const { results } = useFuzzySearch(filteredCategories, query);

  const grandTotal = useMemo(() => {
    let n = 0;
    for (const c of filteredCategories) {
      for (const l of c.links) {
        if (!l.hidden || admin) n++;
      }
    }
    return n;
  }, [filteredCategories, admin]);

  const onActivate = useCallback((item: FlatLink) => {
    if (item.openInSameTab) {
      window.location.assign(item.url);
    } else {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }, []);

  const { index, setIndex } = useKeyboardNav<FlatLink>({
    items: results,
    onActivate,
  });

  const refs = useRef(new Map<string, HTMLAnchorElement>());
  const registerRef = useCallback(
    (link: { id: string }, node: HTMLAnchorElement | null) => {
      if (node) refs.current.set(link.id, node);
      else refs.current.delete(link.id);
    },
    [],
  );

  const activeId =
    index >= 0 && results[index] ? results[index].id : null;

  useEffect(() => {
    if (!activeId) return;
    const el = refs.current.get(activeId);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  useEffect(() => {
    setIndex(query ? 0 : -1);
  }, [query, setIndex]);

  const isSearching = query.trim().length > 0;
  const isEmpty =
    !loading &&
    filteredCategories.every((c) => c.links.filter((l) => !l.hidden || admin).length === 0);
  const brand = data?.brand;
  const title = data?.title;
  const favicon = data?.favicon;
  const minCol = density === "compact" ? 216 : 260;
  const readOnly = data?.readOnly;

  useDocumentBranding({ brand, title, favicon });

  return (
    <div>
      <TopBar
        brand={brand}
        title={title}
        favicon={favicon}
        center={
          <div
            className={`${mobileSearchOpen ? "block" : "hidden sm:block"} w-full min-w-0`}
          >
            <SearchBar
              ref={searchInputRef}
              value={query}
              onChange={setQuery}
              onClear={() => {
                setQuery("");
                setMobileSearchOpen(false);
              }}
              onBlur={() => {
                if (!query) setMobileSearchOpen(false);
              }}
              count={results.length}
              total={grandTotal}
            />
          </div>
        }
        right={
          <div
            className={`${mobileSearchOpen ? "hidden sm:flex" : "flex"} items-center gap-3`}
          >
            <button
              type="button"
              aria-label="Search"
              onClick={() => setMobileSearchOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-surface text-fg-subtle hover:bg-surface-hover hover:text-fg sm:hidden"
            >
              <Search aria-hidden className="h-4 w-4" />
            </button>
            {activeTag ? (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                title={`clear filter: #${activeTag}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-2.5 py-1 text-xs text-accent hover:bg-accent/15"
              >
                #{activeTag} <span aria-hidden>✕</span>
              </button>
            ) : null}
            <DensityToggle density={density} setDensity={setDensity} />
            <AdminChip />
          </div>
        }
      />
      {readOnly && admin ? <ReadOnlyBanner /> : null}

      <div className="mx-auto max-w-[1280px] px-5 pt-6">
        {!isSearching && !isEmpty && (
          <CategoryJump categories={filteredCategories} admin={admin} />
        )}

        {loading ? (
          <p className="mono-dim">Loading…</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : isEmpty ? (
          <EmptyLibrary admin={admin} />
        ) : isSearching ? (
          results.length === 0 ? (
            <NoResults query={query} onClear={() => setQuery("")} />
          ) : (
            <div className="mb-10">
              <div className="label-upper mb-3.5 text-fg-subtle">
                {results.length} result{results.length === 1 ? "" : "s"} — ↑↓ to navigate, ↵ to open
              </div>
              <div
                className="grid"
                style={{
                  gap: density === "compact" ? 8 : 12,
                  gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
                }}
              >
                {results.map((link, i) => {
                  const catIndex = filteredCategories.findIndex((c) => c.id === link.categoryId);
                  const hue = hueForIndex(catIndex >= 0 ? catIndex : 0);
                  return (
                    <LinkCard
                      key={link.id}
                      link={link}
                      hue={hue}
                      admin={admin}
                      density={density}
                      active={i === index}
                      onTagClick={onTagClick}
                      activeTag={activeTag ?? undefined}
                      ref={(node) => registerRef(link, node)}
                    />
                  );
                })}
              </div>
            </div>
          )
        ) : (
          filteredCategories.map((cat, i) => (
            <CategorySection
              key={cat.id}
              category={cat}
              hue={hueForIndex(i)}
              admin={admin}
              density={density}
              activeLinkId={activeId}
              collapsed={isCollapsed(cat.id)}
              onToggle={() => toggleCollapsed(cat.id)}
              registerRef={registerRef}
              onTagClick={onTagClick}
              activeTag={activeTag ?? undefined}
            />
          ))
        )}

        <Footer />
      </div>
    </div>
  );
}
