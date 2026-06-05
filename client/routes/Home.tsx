import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useLinks } from "@/hooks/useLinks";
import { useFuzzySearch, type FlatLink } from "@/hooks/useFuzzySearch";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useLinksSSE } from "@/hooks/useLinksSSE";
import { useSession } from "@/hooks/useSession";
import { useDensity } from "@/hooks/useDensity";
import { useCollapsedCategories } from "@/hooks/useCollapsedCategories";
import { useDocumentBranding } from "@/hooks/useDocumentBranding";
import { hueForIndex } from "@/lib/hue";
import { api } from "@/lib/api";
import { TopBar } from "@/components/TopBar";
import { AdminChip } from "@/components/AdminMenu";
import { SearchBar } from "@/components/SearchBar";
import { CategorySection } from "@/components/CategorySection";
import { CategoryJump } from "@/components/CategoryJump";
import { DensityToggle } from "@/components/DensityToggle";
import { EditModeToggle } from "@/components/EditModeToggle";
import { EditableCategorySection } from "@/components/EditableCategorySection";
import { LinkCard } from "@/components/LinkCard";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { Footer } from "@/components/Footer";
import { EmptyLibrary, NoResults } from "@/components/EmptyStates";
import { NewCategoryForm } from "@/components/admin/CategoryForm";
import type { Category } from "@/lib/types";

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

  const readOnly = data?.readOnly ?? false;

  const [editMode, setEditMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("jabol:editMode") === "1";
  });
  useEffect(() => {
    localStorage.setItem("jabol:editMode", editMode ? "1" : "0");
  }, [editMode]);
  const effectiveEditMode = editMode && admin && !readOnly;

  useEffect(() => {
    if (mobileSearchOpen) searchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  useLinksSSE(reload);

  const allCategories = (data?.categories ?? []).filter((c) => !c.hidden || admin);

  const filteredCategories = useMemo(() => {
    if (!activeTag) return allCategories;
    return allCategories
      .map((c) => ({ ...c, links: c.links.filter((l) => l.tags?.includes(activeTag)) }))
      .filter((c) => c.links.length > 0);
  }, [allCategories, activeTag]);

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

  // Optimistic-friendly mirror of allCategories, used only in edit mode.
  const [viewCategories, setViewCategories] = useState<Category[]>(allCategories);
  useEffect(() => {
    setViewCategories(allCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const isSearching = query.trim().length > 0 && !effectiveEditMode;
  const isEmpty =
    !loading &&
    filteredCategories.every((c) => c.links.filter((l) => !l.hidden || admin).length === 0);
  const brand = data?.brand;
  const title = data?.title;
  const description = data?.description;
  const favicon = data?.favicon;
  const image = data?.image;
  const headerHtml = data?.headerHtml;
  const minCol = density === "compact" ? 216 : 260;

  useDocumentBranding({ brand, title, description, favicon, image, loaded: !!data });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findCategoryOfLink(linkId: string): { catIndex: number; linkIndex: number } | null {
    for (let i = 0; i < viewCategories.length; i++) {
      const j = viewCategories[i].links.findIndex((l) => l.id === linkId);
      if (j >= 0) return { catIndex: i, linkIndex: j };
    }
    return null;
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type as "category" | "link" | undefined;
    if (activeType === "category") {
      const oldIndex = viewCategories.findIndex((c) => c.id === active.id);
      let newIndex = viewCategories.findIndex((c) => c.id === over.id);
      if (newIndex < 0) {
        const loc = findCategoryOfLink(String(over.id));
        if (loc) newIndex = loc.catIndex;
      }
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const next = arrayMove(viewCategories, oldIndex, newIndex);
      setViewCategories(next);
      api.reorderCategories(next.map((c) => c.id)).catch((err) => {
        alert(err?.message ?? "reorder failed");
        reload();
      });
      return;
    }

    if (activeType === "link") {
      const src = findCategoryOfLink(String(active.id));
      if (!src) return;
      let destCatIndex = viewCategories.findIndex((c) => c.id === over.id);
      let destLinkIndex: number | null = null;
      if (destCatIndex < 0) {
        const tgt = findCategoryOfLink(String(over.id));
        if (!tgt) return;
        destCatIndex = tgt.catIndex;
        destLinkIndex = tgt.linkIndex;
      }

      if (src.catIndex === destCatIndex) {
        const oldIdx = src.linkIndex;
        const newIdx = destLinkIndex ?? viewCategories[destCatIndex].links.length - 1;
        if (oldIdx === newIdx) return;
        const cat = viewCategories[destCatIndex];
        const newLinks = arrayMove(cat.links, oldIdx, newIdx);
        const next = viewCategories.map((c, i) =>
          i === destCatIndex ? { ...c, links: newLinks } : c,
        );
        setViewCategories(next);
        api
          .reorderLinks(cat.id, newLinks.map((l) => l.id))
          .catch((err) => {
            alert(err?.message ?? "reorder failed");
            reload();
          });
      } else {
        const movedLink = viewCategories[src.catIndex].links[src.linkIndex];
        const newSourceLinks = viewCategories[src.catIndex].links.filter(
          (_, i) => i !== src.linkIndex,
        );
        const insertAt = destLinkIndex ?? viewCategories[destCatIndex].links.length;
        const newTargetLinks = [
          ...viewCategories[destCatIndex].links.slice(0, insertAt),
          movedLink,
          ...viewCategories[destCatIndex].links.slice(insertAt),
        ];
        const destCatId = viewCategories[destCatIndex].id;
        const next = viewCategories.map((c, i) => {
          if (i === src.catIndex) return { ...c, links: newSourceLinks };
          if (i === destCatIndex) return { ...c, links: newTargetLinks };
          return c;
        });
        setViewCategories(next);
        api.moveLink(movedLink.id, destCatId, insertAt).catch((err) => {
          alert(err?.message ?? "move failed");
          reload();
        });
      }
    }
  }

  function handleDeleteLink(linkId: string) {
    setViewCategories((cats) =>
      cats.map((c) => ({ ...c, links: c.links.filter((l) => l.id !== linkId) })),
    );
    api.deleteLink(linkId).catch((err) => {
      alert(err?.message ?? "delete failed");
      reload();
    });
  }

  const [addingCategory, setAddingCategory] = useState(false);
  const categoryIds = useMemo(() => viewCategories.map((c) => c.id), [viewCategories]);

  return (
    <div>
      <TopBar
        brand={brand}
        title={title}
        favicon={favicon}
        headerHtml={headerHtml}
        center={
          effectiveEditMode ? null : (
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
          )
        }
        right={
          <div
            className={`${mobileSearchOpen ? "hidden sm:flex" : "flex"} items-center gap-3`}
          >
            {!effectiveEditMode && (
              <button
                type="button"
                aria-label="Search"
                onClick={() => setMobileSearchOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-surface text-fg-subtle hover:bg-surface-hover hover:text-fg sm:hidden"
              >
                <Search aria-hidden className="h-4 w-4" />
              </button>
            )}
            {activeTag && !effectiveEditMode ? (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                title={`clear filter: #${activeTag}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-2.5 py-1 text-xs text-accent hover:bg-accent/15"
              >
                #{activeTag} <span aria-hidden>✕</span>
              </button>
            ) : null}
            {admin && !readOnly ? (
              <EditModeToggle editMode={editMode} onToggle={() => setEditMode((v) => !v)} />
            ) : null}
            <DensityToggle density={density} setDensity={setDensity} />
            <AdminChip />
          </div>
        }
      />
      {readOnly && admin ? <ReadOnlyBanner /> : null}

      <div className="mx-auto max-w-[1280px] px-5 pt-6">
        {!isSearching && !isEmpty && !effectiveEditMode && (
          <CategoryJump categories={filteredCategories} admin={admin} />
        )}

        {loading ? (
          <p className="mono-dim">Loading…</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : effectiveEditMode ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
              {viewCategories.map((cat, i) => (
                <EditableCategorySection
                  key={cat.id}
                  category={cat}
                  hue={hueForIndex(i)}
                  density={density}
                  collapsed={isCollapsed(cat.id)}
                  onToggle={() => toggleCollapsed(cat.id)}
                  onChange={reload}
                  onDeleteLink={handleDeleteLink}
                />
              ))}
            </SortableContext>

            {addingCategory ? (
              <div className="mb-12 rounded-md border border-border bg-surface p-4">
                <NewCategoryForm
                  autoFocus
                  onAdded={() => {
                    setAddingCategory(false);
                    reload();
                  }}
                  onCancel={() => setAddingCategory(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="mb-12 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-transparent px-4 py-4 text-sm text-fg-subtle transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-fg"
              >
                <Plus className="h-4 w-4" /> Add category
              </button>
            )}
          </DndContext>
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
