import { useEffect, useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024;

type Status =
  | { kind: "idle" }
  | { kind: "hover" }
  | { kind: "uploading"; name: string }
  | {
      kind: "error";
      message: string;
      issues?: Array<{ path: (string | number)[]; message: string }>;
    }
  | { kind: "success"; counts: { categories: number; links: number } };

type Props = {
  readOnly?: boolean;
  onReplaced: () => void;
};

export function DropZone({ readOnly, onReplaced }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [showIssues, setShowIssues] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (status.kind !== "success") return;
    const t = setTimeout(() => setStatus({ kind: "idle" }), 3000);
    return () => clearTimeout(t);
  }, [status]);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (readOnly) return;
    if (file.size > MAX_BYTES) {
      setStatus({
        kind: "error",
        message: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is ${MAX_BYTES / 1024 / 1024} MB.`,
      });
      return;
    }
    setStatus({ kind: "uploading", name: file.name });
    setShowIssues(false);
    const text = await file.text();
    const result = await api.replaceLinks(text);
    if (result.ok) {
      setStatus({ kind: "success", counts: result.counts });
      onReplaced();
    } else {
      setStatus({ kind: "error", message: result.message, issues: result.issues });
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    handleFile(e.dataTransfer.files?.[0]);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    if (status.kind === "idle" || status.kind === "hover") {
      setStatus({ kind: "hover" });
    }
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (status.kind === "hover") setStatus({ kind: "idle" });
  }

  const hovering = status.kind === "hover";
  const uploading = status.kind === "uploading";
  const isError = status.kind === "error";
  const isSuccess = status.kind === "success";

  return (
    <div className="mb-4">
      <div
        role="button"
        tabIndex={readOnly ? -1 : 0}
        aria-disabled={readOnly}
        onClick={() => !readOnly && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (readOnly) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          borderColor: hovering
            ? "var(--accent)"
            : isError
              ? "color-mix(in srgb, var(--danger) 60%, var(--border-strong))"
              : "var(--border-strong)",
          background: hovering
            ? "color-mix(in srgb, var(--accent) 8%, var(--bg-sunken))"
            : "var(--bg-sunken)",
          opacity: readOnly ? 0.5 : 1,
          cursor: readOnly ? "not-allowed" : "pointer",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <Upload className="h-4 w-4 text-fg-subtle" aria-hidden />

        {uploading ? (
          <span className="text-sm text-fg">uploading {status.name}…</span>
        ) : isSuccess ? (
          <span className="text-sm text-success">
            ✓ imported {status.counts.links} link{status.counts.links === 1 ? "" : "s"} across{" "}
            {status.counts.categories} categor
            {status.counts.categories === 1 ? "y" : "ies"}
          </span>
        ) : (
          <>
            <span className="text-sm text-fg">
              {readOnly
                ? "drop disabled — read-only mount"
                : "drop a links.json here to replace, or click to pick"}
            </span>
            <span className="mono-dim text-xs">
              accepts the same shape as the on-disk links.json (categorized or flat)
            </span>
          </>
        )}
      </div>

      {isError && (
        <div
          className="mt-2 rounded-sm border px-3 py-2 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--danger) 50%, var(--border))",
            background: "color-mix(in srgb, var(--danger) 10%, var(--bg-sunken))",
            color: "var(--fg)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <span>
              <strong className="text-danger">import failed:</strong> {status.message}
            </span>
            <button
              type="button"
              className="text-xs text-fg-subtle hover:text-fg"
              onClick={() => setStatus({ kind: "idle" })}
              aria-label="dismiss"
            >
              ✕
            </button>
          </div>
          {status.issues && status.issues.length > 0 && (
            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowIssues((v) => !v)}
              >
                {showIssues ? "hide" : "show"} all {status.issues.length} issues
              </Button>
              {showIssues && (
                <ul className="mt-2 space-y-1 text-xs text-fg-subtle">
                  {status.issues.map((iss, i) => (
                    <li key={i}>
                      <code className="text-fg">
                        {iss.path.length ? iss.path.join(".") : "(root)"}
                      </code>{" "}
                      — {iss.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="mono-dim mt-2 text-xs">
            Current links are unchanged.
          </p>
        </div>
      )}
    </div>
  );
}
