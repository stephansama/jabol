import { useMemo, useState, type CSSProperties } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import type { Hue } from "@/lib/hue";

type Props = {
  icon?: string;
  name?: string;
  url?: string;
  hue?: Hue;
  size?: number;
  radius?: string;
};

type Stage = "iconify" | "img" | "favicon" | "monogram";

function pickInitialStage(icon: string | undefined): Stage {
  if (icon && icon.includes(":")) return "iconify";
  if (icon && /^https?:\/\//.test(icon)) return "img";
  return "favicon";
}

export function Icon({
  icon,
  name = "?",
  url,
  hue = "red",
  size = 36,
  radius = "var(--radius)",
}: Props) {
  const [stage, setStage] = useState<Stage>(() => pickInitialStage(icon));

  const host = useMemo(() => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }, [url]);

  const box: CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius,
    overflow: "hidden",
  };

  if (stage === "iconify" && icon) {
    const inner = Math.round(size * 0.62);
    return (
      <span
        style={{
          ...box,
          background: `color-mix(in srgb, var(--cat-${hue}) 14%, transparent)`,
        }}
      >
        <IconifyIcon
          icon={icon}
          width={inner}
          height={inner}
          style={{ color: `var(--cat-${hue})` }}
          onError={() => setStage(host ? "favicon" : "monogram")}
        />
      </span>
    );
  }

  if (stage === "img" && icon) {
    return (
      <span
        style={{
          ...box,
          background: "var(--bg-sunken)",
          border: "1px solid var(--border)",
        }}
      >
        <img
          src={icon}
          alt=""
          width={size}
          height={size}
          style={{ objectFit: "contain" }}
          onError={() => setStage(host ? "favicon" : "monogram")}
        />
      </span>
    );
  }

  if (stage === "favicon" && host) {
    const inner = Math.round(size * 0.7);
    return (
      <span
        style={{
          ...box,
          background: "var(--bg-sunken)",
          border: "1px solid var(--border)",
        }}
      >
        <img
          src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
          alt=""
          width={inner}
          height={inner}
          style={{ objectFit: "contain" }}
          onError={() => setStage("monogram")}
        />
      </span>
    );
  }

  return (
    <span
      style={{
        ...box,
        background: `color-mix(in srgb, var(--cat-${hue}) 20%, var(--surface))`,
        color: `var(--cat-${hue})`,
        fontWeight: 700,
        fontSize: size * 0.42,
        letterSpacing: "-0.02em",
      }}
    >
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}
