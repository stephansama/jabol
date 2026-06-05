import { useState, type CSSProperties } from "react";
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, MoreVertical, Pencil, Plus } from "lucide-react";
import { Icon } from "./Icon";
import { EditableLinkCard } from "./EditableLinkCard";
import { CategoryEditor } from "./admin/CategoryForm";
import { NewLinkForm } from "./admin/LinkForm";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/lib/types";
import type { Hue } from "@/lib/hue";
import type { Density } from "@/hooks/useDensity";

type Props = {
  category: Category;
  hue: Hue;
  density?: Density;
  collapsed?: boolean;
  onToggle?: () => void;
  onChange: () => void;
  onDeleteLink: (linkId: string) => void;
};

export function EditableCategorySection({
  category,
  hue,
  density = "comfortable",
  collapsed = false,
  onToggle,
  onChange,
  onDeleteLink,
}: Props) {
  const [editingHeader, setEditingHeader] = useState(false);
  const [adding, setAdding] = useState(false);
  const minCol = density === "compact" ? 216 : 260;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    data: { type: "category", category },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const gridId = `cat-${category.id}-grid`;
  const linkIds = category.links.map((l) => l.id);

  return (
    <section
      ref={setNodeRef}
      style={style}
      id={`cat-${category.id}`}
      className="mb-12"
    >
      <div className="-mx-2 mb-4 flex items-center gap-2.5 rounded-sm px-2 py-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Drag category to reorder"
          aria-label="Drag category"
          className="inline-flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded text-fg-subtle hover:bg-surface-hover hover:text-fg active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={gridId}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-hover hover:text-fg"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronDown
            aria-hidden
            className="h-4 w-4 transition-transform"
            style={{ transform: collapsed ? "rotate(-90deg)" : "none" }}
          />
        </button>
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
        {category.hidden && (
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
        <button
          type="button"
          onClick={() => setEditingHeader((v) => !v)}
          title="Edit category"
          aria-label="Edit category"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-hover hover:text-fg"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Category actions"
              aria-label="Category actions"
              className="inline-flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-hover hover:text-fg"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  await api.updateCategory(category.id, { hidden: !category.hidden });
                  onChange();
                } catch (err: any) {
                  alert(err?.message ?? "update failed");
                }
              }}
            >
              {category.hidden ? "Show category" : "Hide category"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                if (!confirm(`Delete category "${category.name}"? It must be empty.`)) return;
                try {
                  await api.deleteCategory(category.id);
                  onChange();
                } catch (err: any) {
                  alert(err?.message ?? "delete failed");
                }
              }}
              className="text-danger focus:text-danger"
            >
              Delete category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span aria-hidden className="ml-1 h-px flex-1 bg-border" />
      </div>

      {editingHeader && (
        <div className="mb-4 rounded-md border border-border bg-surface p-3">
          <CategoryEditor
            category={category}
            onCancel={() => setEditingHeader(false)}
            onSaved={() => {
              setEditingHeader(false);
              onChange();
            }}
          />
        </div>
      )}

      {!collapsed && (
        <div
          id={gridId}
          className="grid"
          style={{
            gap: density === "compact" ? 8 : 12,
            gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
          }}
        >
          <SortableContext items={linkIds} strategy={rectSortingStrategy}>
            {category.links.map((link) => (
              <EditableLinkCard
                key={link.id}
                link={link}
                hue={hue}
                density={density}
                onChange={onChange}
                onDelete={onDeleteLink}
              />
            ))}
          </SortableContext>

          {adding ? (
            <div className="rounded-sm border border-border bg-surface p-3">
              <NewLinkForm
                categoryId={category.id}
                autoFocus
                onAdded={() => {
                  setAdding(false);
                  onChange();
                }}
                onCancel={() => setAdding(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex min-h-[80px] cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-transparent text-sm text-fg-subtle transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-fg"
            >
              <Plus className="h-4 w-4" /> Add link
            </button>
          )}
        </div>
      )}
    </section>
  );
}
