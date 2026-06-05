import { useState } from "react";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

const inputClass = "rounded-md border border-border bg-bg px-3 py-2 text-fg";
const cancelClass =
  "rounded-md border border-border px-3 py-1.5 text-sm text-fg-subtle hover:text-fg";
const submitClass =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50";
const checkboxLabelClass = "flex items-center gap-2 text-sm text-fg-subtle";

type CategoryEditorProps = {
  category: Pick<Category, "id" | "name" | "icon" | "hidden">;
  onCancel: () => void;
  onSaved: () => void;
};

export function CategoryEditor({ category, onCancel, onSaved }: CategoryEditorProps) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon ?? "");
  const [hidden, setHidden] = useState(!!category.hidden);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateCategory(category.id, {
        name,
        icon: icon || undefined,
        hidden,
      });
      onSaved();
    } catch (err: any) {
      alert(err?.message ?? "save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        required
        className={inputClass}
      />
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Iconify id (optional)"
        className={inputClass}
      />
      <label className={checkboxLabelClass}>
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Hidden (admin-only)
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        <button type="button" onClick={onCancel} className={cancelClass}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={submitClass}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

type NewCategoryFormProps = {
  onAdded: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function NewCategoryForm({ onAdded, onCancel, autoFocus }: NewCategoryFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.addCategory(name.trim(), icon || undefined, hidden || undefined);
      setName("");
      setIcon("");
      setHidden(false);
      onAdded();
    } catch (err: any) {
      alert(err?.message ?? "add failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <input
        autoFocus={autoFocus}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        required
        className={inputClass}
      />
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Iconify id (optional)"
        className={inputClass}
      />
      <label className={checkboxLabelClass}>
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Hidden (admin-only)
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className={cancelClass}>
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={busy} className={submitClass}>
          {busy ? "Adding…" : "Add category"}
        </button>
      </div>
    </form>
  );
}
