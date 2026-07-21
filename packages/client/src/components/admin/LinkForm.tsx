import { useState } from "react";
import { api } from "@/lib/api";
import type { Link } from "@/lib/types";

const inputClass = "rounded-md border border-border bg-bg px-3 py-2 text-fg";
const cancelClass =
  "rounded-md border border-border px-3 py-1.5 text-sm text-fg-subtle hover:text-fg";
const submitClass =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50";
const checkboxLabelClass = "flex items-center gap-2 text-sm text-fg-subtle";

type LinkEditorProps = {
  link: Link;
  onCancel: () => void;
  onSaved: () => void;
};

export function LinkEditor({ link, onCancel, onSaved }: LinkEditorProps) {
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);
  const [icon, setIcon] = useState(link.icon ?? "");
  const [description, setDescription] = useState(link.description ?? "");
  const [tags, setTags] = useState((link.tags ?? []).join(", "));
  const [hidden, setHidden] = useState(!!link.hidden);
  const [openInSameTab, setOpenInSameTab] = useState(!!link.openInSameTab);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateLink(link.id, {
        name,
        url,
        icon: icon || undefined,
        description: description || undefined,
        tags: tags
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
        hidden,
        openInSameTab,
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
      <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
      <input value={url} onChange={(e) => setUrl(e.target.value)} required type="url" className={inputClass} />
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Iconify id (optional, clear to re-fetch favicon)"
        className={inputClass}
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="tag1, tag2"
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={`md:col-span-2 ${inputClass}`}
      />
      <label className={checkboxLabelClass}>
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Hidden (admin-only)
      </label>
      <label className={checkboxLabelClass}>
        <input
          type="checkbox"
          checked={openInSameTab}
          onChange={(e) => setOpenInSameTab(e.target.checked)}
        />
        Open in same tab
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

type NewLinkFormProps = {
  categoryId: string;
  onAdded: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function NewLinkForm({ categoryId, onAdded, onCancel, autoFocus }: NewLinkFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [hidden, setHidden] = useState(false);
  const [openInSameTab, setOpenInSameTab] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addLink(categoryId, {
        name,
        url,
        icon: icon || undefined,
        description: description || undefined,
        tags: tags
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
        hidden: hidden || undefined,
        openInSameTab: openInSameTab || undefined,
      });
      setName("");
      setUrl("");
      setIcon("");
      setDescription("");
      setTags("");
      setHidden(false);
      setOpenInSameTab(false);
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
        placeholder="Name"
        required
        className={inputClass}
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…"
        required
        type="url"
        className={inputClass}
      />
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Iconify id (optional)"
        className={inputClass}
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="tag1, tag2"
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className={`md:col-span-2 ${inputClass}`}
      />
      <label className={checkboxLabelClass}>
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Hidden (admin-only)
      </label>
      <label className={checkboxLabelClass}>
        <input
          type="checkbox"
          checked={openInSameTab}
          onChange={(e) => setOpenInSameTab(e.target.checked)}
        />
        Open in same tab
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className={cancelClass}>
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={busy} className={submitClass}>
          {busy ? "Adding…" : "Add link"}
        </button>
      </div>
    </form>
  );
}
