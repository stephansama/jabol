import { LayoutGrid, LayoutList, type LucideIcon } from "lucide-react";
import type { Density } from "@/hooks/useDensity";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  density: Density;
  setDensity: (d: Density) => void;
};

const OPTIONS: Array<{ value: Density; label: string; Icon: LucideIcon }> = [
  { value: "comfortable", label: "Comfortable", Icon: LayoutGrid },
  { value: "compact", label: "Compact", Icon: LayoutList },
];

export function DensityToggle({ density, setDensity }: Props) {
  return (
    <div
      role="group"
      aria-label="density"
      className="hidden overflow-hidden rounded border border-border bg-bg-sunken sm:inline-flex"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = density === value;
        return (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${label} density`}
                onClick={() => setDensity(value)}
                className="inline-flex h-7 w-9 cursor-pointer items-center justify-center border-none transition-colors"
                style={{
                  background: active ? "var(--surface-raised)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-subtle)",
                }}
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
