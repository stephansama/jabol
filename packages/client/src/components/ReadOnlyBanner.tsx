export function ReadOnlyBanner() {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg"
      style={{
        background: "color-mix(in srgb, var(--warning) 14%, var(--bg-sunken))",
        borderBottom:
          "1px solid color-mix(in srgb, var(--warning) 40%, var(--border))",
      }}
    >
      <span className="font-semibold text-warning">⚠ read-only</span>
      <span className="mono-dim flex-1">
        <code
          className="rounded-sm px-1.5 py-px"
          style={{ background: "var(--bg-code)" }}
        >
          links.json
        </code>{" "}
        is mounted read-only — editing is disabled until the volume is
        writable.
      </span>
    </div>
  );
}
