import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-subtle text-[#74263A]",
        secondary: "border-transparent bg-[#EFECE8] text-foreground",
        destructive: "border-transparent bg-[#FCECEC] text-[#C24141]",
        outline: "border-border text-foreground-secondary",
        success: "border-transparent bg-[#E9F6F0] text-[#16845B]",
        warning: "border-transparent bg-[#FFF5DF] text-[#B7791F]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

function StatusDot({ tone, label }: { tone: "live" | "pending" | "suspended"; label: string }) {
  const dot =
    tone === "live" ? "bg-[#16845B]" : tone === "pending" ? "bg-[#B7791F]" : "bg-[#C24141]";
  const wrap =
    tone === "live"
      ? "bg-[#E9F6F0] text-[#16845B]"
      : tone === "pending"
        ? "bg-[#FFF5DF] text-[#B7791F]"
        : "bg-[#FCECEC] text-[#C24141]";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium", wrap)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}

export { Badge, badgeVariants, StatusDot };
