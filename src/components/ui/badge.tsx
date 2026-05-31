import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-surface-raised text-fg-subtle",
        accent:
          "bg-accent/12 text-accent",
        success:
          "bg-surface-raised text-success",
        warning:
          "bg-surface-raised text-warning",
        danger:
          "bg-surface-raised text-danger",
        info:
          "bg-surface-raised text-info",
        outline:
          "border border-border bg-bg-sunken text-fg-subtle",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
