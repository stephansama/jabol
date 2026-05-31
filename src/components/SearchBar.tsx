import { forwardRef, useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  onBlur?: () => void;
  count: number;
  total: number;
};

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange, onClear, onBlur, count, total },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      const typing = ["INPUT", "TEXTAREA"].includes(tag);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        innerRef.current?.focus();
      } else if (e.key === "Escape") {
        if (document.activeElement === innerRef.current) innerRef.current?.blur();
        onClear();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClear]);

  const placeholder = value
    ? `${count} / ${total} match${count === 1 ? "" : "es"}`
    : `search ${total} links… press / to focus`;

  return (
    <div className="relative w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-base font-semibold text-accent"
      >
        $
      </span>
      <input
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="w-full rounded border border-border-strong bg-surface py-3 pl-9 pr-24 text-base text-fg placeholder:text-fg-subtle/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={onClear}
            title="clear (Esc)"
            className="inline-flex items-center gap-1.5 bg-transparent text-fg-subtle hover:text-fg"
          >
            <span className="kbd">esc</span>
            <span aria-hidden>✕</span>
          </button>
        ) : (
          <span className="kbd">/</span>
        )}
      </div>
    </div>
  );
});
