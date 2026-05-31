import { SignInPanel } from "./AdminMenu";

const KEYS: Array<[string, string]> = [
  ["/", "search"],
  ["↑↓", "navigate"],
  ["enter", "open"],
  ["esc", "clear"],
];

export function Footer() {
  return (
    <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border px-0 pb-10 pt-5">
      <div className="flex flex-wrap items-center gap-4">
        {KEYS.map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="kbd">{k}</span>
            <span className="mono-dim text-xs">{label}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SignInPanel />
        <span className="mono-dim text-xs">jabol · just a bunch of links</span>
      </div>
    </footer>
  );
}
