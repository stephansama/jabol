import { useState } from "react";
import type { Theme, ThemePreference } from "@/lib/types";

const EXPLICIT: Array<{ value: Theme; label: string; dot: string }> = [
  { value: "light", label: "light", dot: "#d20f39" },
  { value: "dark", label: "dark", dot: "#f38ba8" },
];

const SYSTEM: Array<{ value: Exclude<ThemePreference, Theme>; label: string }> = [
  { value: "system", label: "system (follows prefers-color-scheme)" },
];

type Props = {
  preference: ThemePreference | undefined;
  disabled?: boolean;
  onChange: (next: ThemePreference) => Promise<void> | void;
};

export function ThemeSettings({ preference, disabled, onChange }: Props) {
  const current: ThemePreference = preference ?? "system";
  const [busy, setBusy] = useState(false);

  async function pick(value: ThemePreference) {
    if (disabled || busy || value === current) return;
    setBusy(true);
    try {
      await onChange(value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-fg">Theme</h2>
      <div className="rounded-md border border-border bg-surface p-4">
        <fieldset disabled={disabled || busy} className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="label-upper mb-2 text-fg-subtle">explicit</div>
            <div className="space-y-1.5">
              {EXPLICIT.map((opt) => (
                <Row
                  key={opt.value}
                  name="jabol-theme"
                  value={opt.value}
                  label={opt.label}
                  checked={current === opt.value}
                  onSelect={() => pick(opt.value)}
                  dot={opt.dot}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="label-upper mb-2 text-fg-subtle">system preference</div>
            <div className="space-y-1.5">
              {SYSTEM.map((opt) => (
                <Row
                  key={opt.value}
                  name="jabol-theme"
                  value={opt.value}
                  label={opt.label}
                  checked={current === opt.value}
                  onSelect={() => pick(opt.value)}
                />
              ))}
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  );
}

type RowProps = {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  dot?: string;
};

function Row({ name, value, label, checked, onSelect, dot }: RowProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 hover:bg-surface-hover/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="accent-accent"
      />
      {dot && (
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5 rounded-full border border-border"
          style={{ background: dot }}
        />
      )}
      <span className="text-sm text-fg">{label}</span>
    </label>
  );
}
