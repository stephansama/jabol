import type { Canonical, SessionUser, AppInfo, ThemePreference } from "./types";

export type LinksResponse = Canonical & { readOnly: boolean };

export type ReplaceLinksResult =
  | { ok: true; counts: { categories: number; links: number } }
  | { ok: false; message: string; issues?: Array<{ path: (string | number)[]; message: string }> };

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) {
        message = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
      }
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  async info(): Promise<AppInfo> {
    return json<AppInfo>(await fetch("/api/info", { credentials: "include" }));
  },
  async session(): Promise<{ session: { user: SessionUser } | null }> {
    return json(await fetch("/api/session", { credentials: "include" }));
  },
  async links(authed: boolean): Promise<LinksResponse> {
    const path = authed ? "/api/links/admin" : "/api/links";
    return json<LinksResponse>(await fetch(path, { credentials: "include" }));
  },
  async signIn(email: string, password: string): Promise<void> {
    await json(
      await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
  },
  async signOut(): Promise<void> {
    await json(
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );
  },
  async firstSignup(email: string, password: string): Promise<void> {
    await json(
      await fetch("/api/signup", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
  },
  async replaceLinks(body: string): Promise<ReplaceLinksResult> {
    const res = await fetch("/api/links/admin", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body,
    });
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {}
    if (!res.ok) {
      return {
        ok: false,
        message: typeof payload?.error === "string" ? payload.error : `HTTP ${res.status}`,
        issues: Array.isArray(payload?.issues) ? payload.issues : undefined,
      };
    }
    return { ok: true, counts: payload?.counts ?? { categories: 0, links: 0 } };
  },
  async addLink(categoryId: string, link: any): Promise<void> {
    await json(
      await fetch("/api/links/admin", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryId, link }),
      }),
    );
  },
  async updateLink(id: string, patch: any): Promise<void> {
    await json(
      await fetch(`/api/links/admin/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      }),
    );
  },
  async refreshAssets(): Promise<{ count: number }> {
    return json(
      await fetch("/api/links/admin/refresh-assets", {
        method: "POST",
        credentials: "include",
      }),
    );
  },
  async deleteLink(id: string): Promise<void> {
    const res = await fetch(`/api/links/admin/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
  },
  async reorderCategories(ids: string[]): Promise<void> {
    const res = await fetch("/api/categories/order", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
  },
  async reorderLinks(categoryId: string, linkIds: string[]): Promise<void> {
    const res = await fetch("/api/links/admin/order", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId, linkIds }),
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
  },
  async moveLink(linkId: string, categoryId: string, index: number): Promise<void> {
    const res = await fetch(`/api/links/admin/${linkId}/move`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId, index }),
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
  },
  async addCategory(name: string, icon?: string, hidden?: boolean): Promise<void> {
    await json(
      await fetch("/api/categories", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, icon, hidden }),
      }),
    );
  },
  async updateCategory(
    id: string,
    patch: { name?: string; icon?: string; hidden?: boolean },
  ): Promise<void> {
    await json(
      await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      }),
    );
  },
  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
  },
  async listAdmins(): Promise<{ admins: Array<{ id: string; email: string; name: string | null }> }> {
    return json(await fetch("/api/admins", { credentials: "include" }));
  },
  async createAdmin(email: string, password: string): Promise<void> {
    await json(
      await fetch("/api/admins", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
  },
  async deleteAdmin(id: string): Promise<void> {
    const res = await fetch(`/api/admins/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
  },
  async updateSettings(
    patch: {
      brand?: string | null;
      title?: string | null;
      favicon?: string | null;
      headerHtml?: string | null;
      headHtml?: string | null;
      bodyHtml?: string | null;
      theme?: ThemePreference | null;
      accent?: string | null;
    },
  ): Promise<{
    brand?: string;
    title?: string;
    favicon?: string;
    headerHtml?: string;
    headHtml?: string;
    bodyHtml?: string;
    theme?: ThemePreference;
    accent?: string;
  }> {
    return json(
      await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      }),
    );
  },
  async uploadFaviconFile(file: File): Promise<{ favicon?: string }> {
    const form = new FormData();
    form.append("file", file);
    return json(
      await fetch("/api/settings/favicon", {
        method: "POST",
        credentials: "include",
        body: form,
      }),
    );
  },
  async uploadFaviconUrl(url: string): Promise<{ favicon?: string }> {
    return json(
      await fetch("/api/settings/favicon", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      }),
    );
  },
};
