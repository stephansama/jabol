import { useState, type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { LinkCard } from "./LinkCard";
import { LinkEditor } from "./admin/LinkForm";
import type { Link } from "@/lib/types";
import type { Hue } from "@/lib/hue";
import type { Density } from "@/hooks/useDensity";

type Props = {
  link: Link;
  hue?: Hue;
  density?: Density;
  onChange: () => void;
  onDelete: (linkId: string) => void;
};

export function EditableLinkCard({ link, hue, density, onChange, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
    data: { type: "link", link },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-sm border border-border bg-surface p-3"
      >
        <LinkEditor
          link={link}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChange();
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-edit-toolbar]")) return;
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <LinkCard link={link} hue={hue} admin density={density} />
      <div
        data-edit-toolbar
        className="absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-md border border-border bg-surface/95 p-0.5 shadow-sm backdrop-blur"
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          aria-label="Drag to reorder"
          className="inline-flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded text-fg-subtle hover:bg-surface-hover hover:text-fg active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Edit link"
          aria-label="Edit link"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-hover hover:text-fg"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirm(`Delete "${link.name}"?`)) return;
            onDelete(link.id);
          }}
          title="Delete link"
          aria-label="Delete link"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-hover hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
