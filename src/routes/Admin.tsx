import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { api, type LinksResponse } from "@/lib/api";
import { useSession } from "@/hooks/useSession";
import { useDocumentBranding } from "@/hooks/useDocumentBranding";
import { useResolvedTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/Icon";
import { ThemeSettings } from "@/components/ThemeSettings";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { Button } from "@/components/ui/button";
import { DropZone } from "@/components/admin/DropZone";
import type { Category, Link as LinkType } from "@/lib/types";

export function Admin() {
  const navigate = useNavigate();
  const { user, loading: sessionLoading, signOut } = useSession();
  const [data, setData] = useState<LinksResponse | null>(null);
  const [admins, setAdmins] = useState<Array<{ id: string; email: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [links, ads] = await Promise.all([api.links(true), api.listAdmins()]);
      setData(links);
      setAdmins(ads.admins);
    } catch (err: any) {
      setError(err?.message ?? "load failed");
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && !user) navigate("/login", { replace: true });
  }, [sessionLoading, user, navigate]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  useDocumentBranding({
    brand: data?.brand,
    title: data?.title,
    favicon: data?.favicon,
  });
  useResolvedTheme(data?.theme);

  if (sessionLoading || !user) return <p className="mt-20 text-center text-fg-subtle">…</p>;

  const readOnly = data?.readOnly ?? false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Admin</h1>
          <p className="text-sm text-fg-subtle">Signed in as {user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/">View site</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      {readOnly ? <ReadOnlyBanner /> : null}
      {error ? <p className="mb-4 text-danger">{error}</p> : null}

      <BrandingManager data={data} readOnly={readOnly} onChange={refresh} />

      <ThemeSettings
        preference={data?.theme}
        disabled={readOnly}
        onChange={async (next) => {
          await api.updateSettings({ theme: next });
          refresh();
        }}
      />

      <CategoryManager data={data} readOnly={readOnly} onChange={refresh} />

      <AdminManager admins={admins} selfId={user.id} onChange={refresh} />
    </div>
  );
}

function CategoryManager({
  data,
  readOnly,
  onChange,
}: {
  data: LinksResponse | null;
  readOnly: boolean;
  onChange: () => void;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await api.addCategory(newCatName.trim(), newCatIcon || undefined);
    setNewCatName("");
    setNewCatIcon("");
    onChange();
  }

  function exportLinks() {
    if (!data) return;
    const { readOnly: _ro, ...canonical } = data;
    const json = JSON.stringify(canonical, null, 2) + "\n";
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `links-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-fg">Links</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportLinks}
          disabled={!data}
          title="Download a links.json snapshot of the current configuration"
        >
          <Download className="h-3.5 w-3.5" /> Export links.json
        </Button>
      </div>
      <DropZone readOnly={readOnly} onReplaced={onChange} />
      {!readOnly ? (
        <form
          onSubmit={addCategory}
          className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-3"
        >
          <label className="flex-1">
            <span className="text-xs text-fg-subtle">New category name</span>
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg"
              placeholder="e.g. Work tools"
            />
          </label>
          <label className="w-56">
            <span className="text-xs text-fg-subtle">Iconify icon (optional)</span>
            <input
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg"
              placeholder="e.g. mdi:briefcase"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85"
          >
            Add category
          </button>
        </form>
      ) : null}

      {(data?.categories ?? []).map((cat) => (
        <CategoryBlock key={cat.id} category={cat} readOnly={readOnly} onChange={onChange} />
      ))}
    </section>
  );
}

function CategoryBlock({
  category,
  readOnly,
  onChange,
}: {
  category: Category;
  readOnly: boolean;
  onChange: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {category.icon ? <Icon icon={category.icon} name={category.name} size={20} /> : null}
          <h3 className="font-semibold text-fg">{category.name}</h3>
          <span className="text-xs text-fg-subtle">({category.links.length})</span>
        </div>
        {!readOnly ? (
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Delete category "${category.name}"? It must be empty.`)) return;
              try {
                await api.deleteCategory(category.id);
                onChange();
              } catch (err: any) {
                alert(err?.message ?? "delete failed");
              }
            }}
            className="text-xs text-fg-subtle hover:text-danger"
          >
            Delete category
          </button>
        ) : null}
      </header>

      <ul className="divide-y divide-border">
        {category.links.map((link) =>
          editingId === link.id ? (
            <LinkEditor
              key={link.id}
              link={link}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                onChange();
              }}
            />
          ) : (
            <LinkRow
              key={link.id}
              link={link}
              readOnly={readOnly}
              onEdit={() => setEditingId(link.id)}
              onDelete={async () => {
                if (!confirm(`Delete "${link.name}"?`)) return;
                await api.deleteLink(link.id);
                onChange();
              }}
              onToggleHidden={async () => {
                await api.updateLink(link.id, { hidden: !link.hidden });
                onChange();
              }}
            />
          ),
        )}
      </ul>

      {!readOnly ? <NewLinkRow categoryId={category.id} onAdded={onChange} /> : null}
    </div>
  );
}

function LinkRow({
  link,
  readOnly,
  onEdit,
  onDelete,
  onToggleHidden,
}: {
  link: LinkType;
  readOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Icon icon={link.icon} name={link.name} url={link.url} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-fg">{link.name}</span>
          {link.hidden ? (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              🔒 hidden
            </span>
          ) : null}
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-fg-subtle hover:text-accent"
        >
          {link.url}
        </a>
      </div>
      {!readOnly ? (
        <div className="flex items-center gap-2">
          <button onClick={onToggleHidden} className="text-xs text-fg-subtle hover:text-fg">
            {link.hidden ? "Show" : "Hide"}
          </button>
          <button onClick={onEdit} className="text-xs text-fg-subtle hover:text-fg">
            Edit
          </button>
          <button onClick={onDelete} className="text-xs text-fg-subtle hover:text-danger">
            Delete
          </button>
        </div>
      ) : null}
    </li>
  );
}

function NewLinkRow({ categoryId, onAdded }: { categoryId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [hidden, setHidden] = useState(false);
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
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        hidden: hidden || undefined,
      });
      setName("");
      setUrl("");
      setIcon("");
      setDescription("");
      setTags("");
      setHidden(false);
      setOpen(false);
      onAdded();
    } catch (err: any) {
      alert(err?.message ?? "add failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="px-4 py-2">
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-fg-subtle hover:text-accent"
        >
          + Add link
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" required type="url" className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
      <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Iconify id (optional)" className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2" className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="md:col-span-2 rounded-md border border-border bg-bg px-3 py-2 text-fg" />
      <label className="flex items-center gap-2 text-sm text-fg-subtle">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Hidden (admin-only)
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm text-fg-subtle hover:text-fg">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50">
          {busy ? "Adding…" : "Add link"}
        </button>
      </div>
    </form>
  );
}

function LinkEditor({
  link,
  onCancel,
  onSaved,
}: {
  link: LinkType;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);
  const [icon, setIcon] = useState(link.icon ?? "");
  const [description, setDescription] = useState(link.description ?? "");
  const [tags, setTags] = useState((link.tags ?? []).join(", "));
  const [hidden, setHidden] = useState(!!link.hidden);
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
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
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
    <li className="px-4 py-3">
      <form onSubmit={submit} className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} required type="url" className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Iconify id (optional, clear to re-fetch favicon)" className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2" className="rounded-md border border-border bg-bg px-3 py-2 text-fg" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="md:col-span-2 rounded-md border border-border bg-bg px-3 py-2 text-fg" />
        <label className="flex items-center gap-2 text-sm text-fg-subtle">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          Hidden (admin-only)
        </label>
        <div className="flex justify-end gap-2 md:col-span-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-sm text-fg-subtle hover:text-fg">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </li>
  );
}

function BrandingManager({
  data,
  readOnly,
  onChange,
}: {
  data: LinksResponse | null;
  readOnly: boolean;
  onChange: () => void;
}) {
  const [brand, setBrand] = useState(data?.brand ?? "");
  const [title, setTitle] = useState(data?.title ?? "");
  const [faviconUrl, setFaviconUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Keep the form inputs in sync with the latest data when it reloads after a save / SSE event.
  useEffect(() => {
    setBrand(data?.brand ?? "");
    setTitle(data?.title ?? "");
  }, [data?.brand, data?.title]);

  const currentFavicon = data?.favicon;

  async function saveText(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const trimmedBrand = brand.trim();
      const trimmedTitle = title.trim();
      await api.updateSettings({
        brand: trimmedBrand ? trimmedBrand : null,
        title: trimmedTitle ? trimmedTitle : null,
      });
      setNotice("Saved.");
      onChange();
    } catch (err: any) {
      setError(err?.message ?? "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.uploadFaviconFile(file);
      setNotice("Favicon uploaded.");
      onChange();
    } catch (err: any) {
      setError(err?.message ?? "upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveFaviconUrl(e: React.FormEvent) {
    e.preventDefault();
    const url = faviconUrl.trim();
    if (!url) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.uploadFaviconUrl(url);
      setFaviconUrl("");
      setNotice("Favicon fetched and cached.");
      onChange();
    } catch (err: any) {
      setError(err?.message ?? "fetch failed");
    } finally {
      setBusy(false);
    }
  }

  async function clearFavicon() {
    if (!confirm("Reset the favicon to the default?")) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.updateSettings({ favicon: null });
      setNotice("Favicon reset.");
      onChange();
    } catch (err: any) {
      setError(err?.message ?? "reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-fg">Branding</h2>

      <form
        onSubmit={saveText}
        className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-3"
      >
        <label className="flex-1 min-w-[200px]">
          <span className="text-xs text-fg-subtle">Organization name</span>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={readOnly || busy}
            maxLength={80}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg disabled:opacity-60"
            placeholder="e.g. Acme Co"
          />
        </label>
        <label className="flex-1 min-w-[200px]">
          <span className="text-xs text-fg-subtle">Collection title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly || busy}
            maxLength={200}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg disabled:opacity-60"
            placeholder="e.g. Internal links"
          />
        </label>
        <button
          type="submit"
          disabled={readOnly || busy}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="mb-3 flex items-center gap-3">
          <img
            src={currentFavicon || "/favicon.svg"}
            alt="favicon preview"
            width={32}
            height={32}
            className="h-8 w-8 rounded border border-border bg-bg object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-fg-subtle">Current favicon</p>
            <p className="truncate text-sm text-fg">
              {currentFavicon ?? <span className="text-fg-subtle">default</span>}
            </p>
          </div>
          {!readOnly && currentFavicon ? (
            <button
              type="button"
              onClick={clearFavicon}
              disabled={busy}
              className="text-xs text-fg-subtle hover:text-danger disabled:opacity-50"
            >
              Reset
            </button>
          ) : null}
        </div>

        {!readOnly ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block">
                <span className="text-xs text-fg-subtle">Upload an image (svg, png, jpg, webp, ico, gif — max 512 KB)</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg,image/webp,image/x-icon,image/gif"
                  onChange={uploadFile}
                  disabled={busy}
                  className="mt-1 block w-full text-sm text-fg file:mr-3 file:rounded-sm file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-fg hover:file:bg-accent/85 disabled:opacity-50"
                />
              </label>
            </div>
            <form onSubmit={saveFaviconUrl} className="flex flex-1 items-end gap-2">
              <label className="flex-1">
                <span className="text-xs text-fg-subtle">…or paste an image URL</span>
                <input
                  type="url"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  disabled={busy}
                  className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg disabled:opacity-60"
                  placeholder="https://example.com/icon.png"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !faviconUrl.trim()}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50"
              >
                Fetch
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {notice ? <p className="mt-2 text-sm text-fg-subtle">{notice}</p> : null}
    </section>
  );
}

function AdminManager({
  admins,
  selfId,
  onChange,
}: {
  admins: Array<{ id: string; email: string }>;
  selfId: string;
  onChange: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createAdmin(email, password);
      setEmail("");
      setPassword("");
      onChange();
    } catch (err: any) {
      setError(err?.message ?? "create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-fg">Admins</h2>
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-3">
        <label className="flex-1">
          <span className="text-xs text-fg-subtle">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg"
          />
        </label>
        <label className="flex-1">
          <span className="text-xs text-fg-subtle">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg"
          />
        </label>
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50">
          {busy ? "Creating…" : "Add admin"}
        </button>
      </form>
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {admins.map((a) => (
          <li key={a.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-fg">
              {a.email}
              {a.id === selfId ? <span className="ml-2 text-xs text-fg-subtle">(you)</span> : null}
            </span>
            {a.id !== selfId ? (
              <button
                onClick={async () => {
                  if (!confirm(`Remove admin ${a.email}?`)) return;
                  try {
                    await api.deleteAdmin(a.id);
                    onChange();
                  } catch (err: any) {
                    alert(err?.message ?? "delete failed");
                  }
                }}
                className="text-xs text-fg-subtle hover:text-danger"
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
