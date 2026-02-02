import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-white hover:bg-gray-900/80 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600/80",
        destructive:
          "border-transparent bg-[#8b4049] text-white hover:bg-[#8b4049]/80 dark:bg-[#f87171] dark:hover:bg-[#f87171]/80",
        success:
          "border-transparent bg-[#76c893] text-white hover:bg-[#76c893]/80 dark:bg-[#4ade80] dark:hover:bg-[#4ade80]/80",
        warning:
          "border-transparent bg-[#d9ed92] text-gray-900 hover:bg-[#d9ed92]/80 dark:bg-[#fbbf24] dark:text-gray-900 dark:hover:bg-[#fbbf24]/80",
        primary:
          "border-transparent bg-[#1a759f] text-white hover:bg-[#1a759f]/80 dark:bg-[#38bdf8] dark:hover:bg-[#38bdf8]/80",
        outline: "text-foreground dark:text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
