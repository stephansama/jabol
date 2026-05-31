# jabol — frontend design brief

> **How to use:** paste this whole file into a fresh Claude session (Claude.ai project, Claude Code, or with the `/frontend-design` skill) as the standing brief for any design or redesign work on the jabol SPA. It is self-contained — you should not need to open the repo to do a credible first pass. When the source of truth disagrees with this brief, fix the brief.

## 1. Product in one paragraph

jabol ("Just A Bunch Of Links") is a self-hostable, single-binary link directory. The owner drops a `links.json` on disk, runs a container, and visitors get a fast, searchable bookmark page on `:8080`. There is no CMS, no database for the content (auth uses SQLite separately), and no JavaScript-heavy framework — the whole experience is one React 18 SPA backed by a small Hono server. It targets two audiences:

- **Visitors** — they hit the home page, browse categorized links, and search. Most never sign in. They care about speed, density, and being able to find a link by name/tag in two keystrokes.
- **The owner / admins** — they sign in to add, edit, hide, and remove links and categories from a web UI that writes back to `links.json` atomically. They also use the SPA day-to-day as a visitor.

The product personality is **homelab / developer terminal-adjacent**: calm, dense, keyboard-friendly, fast to first paint, no dark patterns, no marketing surface. Catppuccin themes are first-class.

## 2. Surfaces to design

| Route        | Component                | One-liner                                                                   |
|--------------|--------------------------|-----------------------------------------------------------------------------|
| `/`          | `src/routes/Home.tsx`    | Search bar + categorized link grid. Keyboard hints in footer.               |
| `/login`     | `src/routes/Login.tsx`   | Email/password sign-in. Optional "create first admin" link if `signupOpen`. |
| `/signup`    | `src/routes/Signup.tsx`  | One-shot first-admin form, gated by `signupOpen`. Shows closed state once an admin exists. |
| `/admin`     | `src/routes/Admin.tsx`   | Three stacked panels: categories, links (per category, with inline edit), admin users. |

Cross-cutting surfaces that appear on multiple routes:

- **`ReadOnlyBanner`** — alert bar shown when the mounted `links.json` is read-only. Stays visible everywhere admins land.
- **`ThemeSwitcher`** — four-swatch pill: `light`, `dark`, `mocha`, `latte`. Active theme shows an accent ring.
- **`AdminMenu`** — top-right; shows "Sign in" when logged out, "Admin" + "Sign out" when logged in.

## 3. Content model

A **link card** renders these fields (all but `name`/`url` optional):

- `name` — required, prominent.
- `url` — required, opened in a new tab.
- `description` — short, 2-line clamp under the name.
- `icon` — either an **Iconify id** (`mdi:github`) or an absolute URL. If absent, the server fetches and caches a favicon. If that fails, the `Icon` component falls back to a letter monogram on an accent badge. This three-tier fallback is part of the design contract — never let a card render without a glyph.
- `image` — optional OG image override; the server fetches `og:image` if missing. Not currently rendered on the home card (reserve for hover/preview ideas).
- `tags` — `string[]`, rendered as small pills below the description.
- `hidden` — boolean; admins see a "🔒 hidden" badge. Visitors don't see the link at all.

A `links.json` has two shapes that both normalize to the same `Canonical` on the server, so the SPA only sees one shape:

```ts
// src/lib/types.ts
type Canonical = {
  title?: string;
  description?: string;
  theme?: Theme;                // first-time visitor default only
  categories: Category[];
};
type Category = { id: string; name: string; icon?: string; links: Link[] };
type Link = {
  id: string; name: string; url: string;
  description?: string; icon?: string; image?: string;
  tags?: string[]; hidden?: boolean;
};
```

"Flat with `groupByTag: true`" is reshaped server-side into synthetic categories whose names are tag names — so the home page only ever renders categories, never two divergent layouts.

## 4. Aesthetic direction

- **Calm contrast.** No neon, no marketing gradients. Surfaces sit on `--bg`; cards on `--surface`; borders are quiet (`--border`); the only saturated color is the accent.
- **Density over whitespace** — a homelab landing page beats a SaaS landing page. A 4-column grid of 12+ links should feel comfortable, not sparse.
- **Restrained motion.** A 150ms color transition on theme change. Subtle hover (shadow + accent border on cards). No springy animations.
- **Keyboard-forward.** The footer surfaces the keyboard contract; the design should treat keyboard nav as the primary path, mouse as secondary.
- **Theme-honest.** Mocha and Latte are full Catppuccin palettes — designs should look at home next to a tiling window manager screenshot, not a Figma marketing page.

## 5. Design tokens

All color tokens are CSS custom properties on `:root[data-theme="…"]`, stored as RGB triplets (e.g. `30 30 46`). The four sets live in `src/styles/themes.css`. Tailwind v4 reads them through an inline `@theme` block in `src/styles/globals.css`:

```css
/* src/styles/globals.css */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-border: var(--border);
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
```

So in JSX you write `bg-bg`, `text-fg`, `text-muted`, `border-border`, `ring-accent`, `bg-surface` — never hex codes, never theme-aware ternaries.

**Token reference (RGB):**

| Token       | light            | dark             | mocha            | latte            |
|-------------|------------------|------------------|------------------|------------------|
| `--bg`      | `255 255 255`    | `17 17 19`       | `30 30 46`       | `239 241 245`    |
| `--surface` | `245 245 248`    | `30 30 33`       | `49 50 68`       | `220 224 232`    |
| `--fg`      | `24 24 27`       | `235 235 240`    | `205 214 244`    | `76 79 105`      |
| `--muted`   | `100 100 110`    | `160 160 170`    | `166 173 200`    | `108 111 133`    |
| `--accent`  | `79 70 229`      | `99 102 241`     | `203 166 247`    | `136 57 239`     |
| `--border`  | `220 220 225`    | `50 50 55`       | `69 71 90`       | `204 208 218`    |

**Typography** — system stack, no web fonts. Use Tailwind's default `text-xs`/`sm`/`base`/`lg`/`xl` scale.

**Spacing, radius, shadow** — use Tailwind defaults. Established patterns: `rounded-lg` / `rounded-xl` on cards, `rounded-full` on pills, `shadow-sm` resting and `shadow-md` on hover, `gap-3`–`gap-6` for grids. Don't invent new scales.

**Focus** — `:focus-visible` is globally styled `ring-2 ring-accent ring-offset-2 ring-offset-bg`. Every interactive element inherits this; don't suppress it.

## 6. Interaction model

**Keyboard contract (non-negotiable):**

| Key           | Action                                              |
|---------------|-----------------------------------------------------|
| `/`           | Focus the search bar (ignored inside inputs).       |
| `↑` / `↓`     | Move the result highlight on Home.                  |
| `Enter`       | Open the highlighted link in a new tab.             |
| `Esc`         | Clear the search.                                   |

**Search** — `src/hooks/useFuzzySearch.ts` runs Fuse.js client-side with weights `name 0.5`, `tags 0.3`, `description 0.2`, threshold `0.4`. Default state shows all categories; the moment the query is non-empty, the home page flattens into a single ranked list of `LinkCard`s with the active item highlighted. The search bar's placeholder should reflect the current match count.

**Live updates** — `src/hooks/useLinksSSE.ts` subscribes to `/api/events` and refetches on `links:update`. Designs must tolerate a sudden re-render: avoid layout shift when a card appears, disappears, or has its icon/image swap in after enrichment.

**Read-only mode** — `useLinks` returns `readOnly: boolean`. Every admin affordance must have a disabled-with-tooltip variant when true; the banner explains why.

**Sign-in posture** — visitors never see admin UI. Admins (any signed-in user) see the `AdminMenu`, the "🔒 hidden" badge on hidden links, and can navigate to `/admin`. There is no role system.

## 7. Data hooks the design must consume

Designers do not introduce new fetching. Wire any new screen to these:

| Hook                            | Returns                                                            |
|---------------------------------|--------------------------------------------------------------------|
| `useLinks(authed)`              | `{ data: { canonical, readOnly } \| null, error, loading, reload }` |
| `useLinksSSE(onUpdate)`         | Subscribes to SSE; calls `onUpdate()` on `links:update`.           |
| `useSession()`                  | `{ user, loading, signIn, signOut, refresh }`.                     |
| `useFuzzySearch(categories, q)` | `{ results: FlatLink[], totalCount }`.                             |
| `useKeyboardNav(items, onActivate, enabled?)` | `{ index, setIndex, reset }`.                          |
| `useTheme()`                    | `{ theme, setTheme, themes: ["light","dark","mocha","latte"] }`.   |

`AppInfo` (`{ readOnly, signupOpen, hasAdmin }`) drives gating for `/signup` and the read-only banner; consume via `useLinks` / the `/api/info` endpoint.

## 8. Component inventory

All under `src/components/`. Reuse before inventing.

- **`LinkCard.tsx`** — bordered card on `bg-surface`. Icon (36px) + name + optional description (line-clamp-2) + optional tag pills. `active` prop draws a `ring-accent` on keyboard highlight. Forwarded ref for `scrollIntoView`.
- **`CategorySection.tsx`** — category header (icon + name + link count) and a responsive grid of `LinkCard`s.
- **`SearchBar.tsx`** — input with a `/` keyboard-hint badge; global listener focuses; `Esc` clears.
- **`ThemeSwitcher.tsx`** — four swatch buttons. The active one shows a ring.
- **`Icon.tsx`** — renders an Iconify id, a favicon URL, or a monogram fallback. Always renders something.
- **`AdminMenu.tsx`** — top-right account control.
- **`ReadOnlyBanner.tsx`** — full-width alert, used wherever admins land.

## 9. Constraints / non-negotiables

- **Stack:** React 18 + React Router 6 + Vite 5 + Tailwind v4 (inline `@theme`, no `tailwind.config.ts`). No new UI framework, no shadcn, no Radix unless explicitly requested.
- **No SSR.** First paint runs through the inline theme-application script in `index.html` (reads `localStorage.getItem("jabol.theme")`, falls back to `prefers-color-scheme`). Do not break the no-flash boot.
- **Icon contract.** Iconify → favicon → monogram. Don't add a second icon library. Iconify ids look like `mdi:github`.
- **Mobile-first.** The home grid is 1→4 columns responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
- **No roles.** "Admin" = any signed-in user. Don't design role-based UI.
- **Read-only is a first-class state.** Every admin affordance must have a disabled-with-explanation variant.
- **No external font loads.** System stack only.
- **Atomic writes already happen server-side.** Don't design optimistic UI that pretends mutations are local-only — they go through `POST/PATCH/DELETE /api/...` and the SSE channel re-broadcasts the canonical.

## 10. Out of scope

- Backend/API changes, swapping the auth mechanism (better-auth + better-sqlite3), changing the `links.json` shape, adding a content database, themes beyond the four shipped, drag-and-drop reordering that requires API changes (the API has no `order` field), i18n, analytics, telemetry, marketing pages.

## 11. Acceptance signals — what "good" looks like

- Keyboard contract preserved verbatim (`/`, `↑`, `↓`, `Enter`, `Esc`).
- Every new surface renders correctly in all four themes — open each, eyeball contrast.
- Mobile (≤640px) is comfortable, not an afterthought.
- No flash of unstyled or wrong-theme content on first paint.
- Read-only mode visibly disables admin affordances and explains why.
- Hidden links remain hidden from unauthenticated viewers.
- Sub-100ms perceived response on search input and theme switch.
- No new top-level dependencies unless flagged in the design notes with a justification.

## 12. Open creative prompts

These are invitations to think, not requirements. Feel free to riff on, expand, or ignore.

- **Empty states.** What does the home page look like when `links.json` is empty? When a search returns zero results? Today these states are minimal — there's room.
- **First-run.** The `/signup` page is shown exactly once in a deployment's life. Can it feel like an unboxing instead of a form?
- **Density modes.** Could the visitor toggle between "comfortable" and "compact" densities? Where would that control live?
- **OG image use.** The data model already stores `image` per link. Could it surface in a hover preview, a featured shelf, or an alternate "rich" card layout for opted-in categories?
- **Admin flow.** The admin UI is currently three stacked panels. What would a single-screen "command palette"-style edit flow look like (add link by URL, autocomplete category, paste-to-create)?
- **Category icons.** Today they're a single Iconify glyph next to the name. Could they become the visual organizing principle (color-coded headers, sidebar of category icons, etc.)?
- **Reorder.** The server has no `order` field today — but if you wanted reordering, what's the minimum API change and the lightest UI for it?
- **Public sharing.** Could the owner mark a category "public" and get a stable shareable URL? What does the recipient page look like (no admin chrome, no theme switcher?)?
- **Mobile-first admin.** The admin UI assumes a desktop. What does one-handed phone editing look like?

When in doubt: smaller, faster, more keyboard. The product wins by being a near-instant page that loads in any tab on any device — every design decision should defend that.
