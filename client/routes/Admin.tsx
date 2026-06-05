import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, RefreshCw } from "lucide-react";
import { api, type LinksResponse } from "@/lib/api";
import { useSession } from "@/hooks/useSession";
import { useDocumentBranding } from "@/hooks/useDocumentBranding";
import { useResolvedTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/Icon";
import { ThemeSettings } from "@/components/ThemeSettings";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { Button } from "@/components/ui/button";
import { DropZone } from "@/components/admin/DropZone";
import { LinkEditor, NewLinkForm } from "@/components/admin/LinkForm";
import type { Category, Link as LinkType } from "@/lib/types";

export default function Admin() {
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
    description: data?.description,
    favicon: data?.favicon,
    image: data?.image,
    loaded: !!data,
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

      <CustomHtmlManager data={data} readOnly={readOnly} onChange={refresh} />

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
  const [newCatHidden, setNewCatHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  async function refreshAssets() {
    setRefreshing(true);
    setRefreshNotice(null);
    try {
      const { count } = await api.refreshAssets();
      setRefreshNotice(`Refreshed ${count} link${count === 1 ? "" : "s"}.`);
      onChange();
    } catch (err: any) {
      setRefreshNotice(err?.message ?? "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await api.addCategory(newCatName.trim(), newCatIcon || undefined, newCatHidden || undefined);
    setNewCatName("");
    setNewCatIcon("");
    setNewCatHidden(false);
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-fg">Links</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refreshAssets}
            disabled={readOnly || refreshing}
            title="Re-scrape favicons and OG images for every link"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh assets"}
          </Button>
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
      </div>
      {refreshNotice ? (
        <p className="-mt-1 mb-3 text-xs text-fg-subtle">{refreshNotice}</p>
      ) : null}
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
          <label className="flex h-[42px] items-center gap-2 text-xs text-fg-subtle">
            <input
              type="checkbox"
              checked={newCatHidden}
              onChange={(e) => setNewCatHidden(e.target.checked)}
              className="h-4 w-4"
            />
            Hidden (admin-only)
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
          {category.hidden ? (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              🔒 hidden
            </span>
          ) : null}
        </div>
        {!readOnly ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await api.updateCategory(category.id, { hidden: !category.hidden });
                  onChange();
                } catch (err: any) {
                  alert(err?.message ?? "update failed");
                }
              }}
              className="text-xs text-fg-subtle hover:text-fg"
            >
              {category.hidden ? "Show category" : "Hide category"}
            </button>
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
          </div>
        ) : null}
      </header>

      <ul className="divide-y divide-border">
        {category.links.map((link) =>
          editingId === link.id ? (
            <li key={link.id} className="px-4 py-3">
              <LinkEditor
                link={link}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  onChange();
                }}
              />
            </li>
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

      {!readOnly ? <NewLinkRowToggle categoryId={category.id} onAdded={onChange} /> : null}
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

function NewLinkRowToggle({ categoryId, onAdded }: { categoryId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);

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
    <div className="px-4 py-3">
      <NewLinkForm
        categoryId={categoryId}
        onAdded={() => {
          setOpen(false);
          onAdded();
        }}
        onCancel={() => setOpen(false)}
        autoFocus
      />
    </div>
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
  const [headerHtml, setHeaderHtml] = useState(data?.headerHtml ?? "");
  const [useCustom, setUseCustom] = useState(!!data?.headerHtml);
  const [faviconUrl, setFaviconUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Keep the form inputs in sync with the latest data when it reloads after a save / SSE event.
  useEffect(() => {
    setBrand(data?.brand ?? "");
    setTitle(data?.title ?? "");
    setHeaderHtml(data?.headerHtml ?? "");
    setUseCustom(!!data?.headerHtml);
  }, [data?.brand, data?.title, data?.headerHtml]);

  const currentFavicon = data?.favicon;

  async function saveText(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const trimmedHeader = headerHtml.trim();
      if (useCustom && trimmedHeader) {
        await api.updateSettings({
          headerHtml: trimmedHeader,
          brand: null,
          title: null,
        });
      } else {
        const trimmedBrand = brand.trim();
        const trimmedTitle = title.trim();
        await api.updateSettings({
          headerHtml: null,
          brand: trimmedBrand ? trimmedBrand : null,
          title: trimmedTitle ? trimmedTitle : null,
        });
      }
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
        className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3"
      >
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
            disabled={readOnly || busy}
            className="h-4 w-4"
          />
          Use custom HTML for the page header
        </label>

        {useCustom ? (
          <label className="block">
            <span className="text-xs text-fg-subtle">
              Custom header HTML (replaces favicon + brand + title in the top bar). Inline event
              handlers run; <code>&lt;script&gt;</code> tags do not. The browser tab title still
              comes from the organization name.
            </span>
            <textarea
              value={headerHtml}
              onChange={(e) => setHeaderHtml(e.target.value)}
              disabled={readOnly || busy}
              maxLength={4096}
              rows={6}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-fg disabled:opacity-60"
              placeholder='<img src="/api/icons/logo.svg" class="h-7 w-7" /><span class="text-base font-semibold">My Site</span>'
            />
          </label>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
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
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={readOnly || busy}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
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

function CustomHtmlManager({
  data,
  readOnly,
  onChange,
}: {
  data: LinksResponse | null;
  readOnly: boolean;
  onChange: () => void;
}) {
  const [headHtml, setHeadHtml] = useState(data?.headHtml ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setHeadHtml(data?.headHtml ?? "");
  }, [data?.headHtml]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const trimmed = headHtml.trim();
      await api.updateSettings({ headHtml: trimmed ? trimmed : null });
      setNotice("Saved.");
      onChange();
    } catch (err: any) {
      setError(err?.message ?? "save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-fg">Custom HTML</h2>
      <form
        onSubmit={save}
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3"
      >
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">
          <strong>Warning:</strong> this HTML is injected verbatim into the document{" "}
          <code>&lt;head&gt;</code> on every request. <code>&lt;script&gt;</code> tags run.
          Only paste code you trust — admins, third-party analytics, etc.
        </p>
        <label className="block">
          <span className="text-xs text-fg-subtle">
            Extra HTML for the <code>&lt;head&gt;</code> — analytics snippets, custom meta
            tags, font preloads, etc. Up to 16 KB.
          </span>
          <textarea
            value={headHtml}
            onChange={(e) => setHeadHtml(e.target.value)}
            disabled={readOnly || busy}
            maxLength={16384}
            rows={8}
            spellCheck={false}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-fg disabled:opacity-60"
            placeholder={'<script defer src="https://plausible.io/js/script.js" data-domain="example.com"></script>'}
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={readOnly || busy}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/85 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {notice ? <p className="text-sm text-fg-subtle">{notice}</p> : null}
      </form>
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
