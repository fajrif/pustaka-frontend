import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground rounded-full",
    secondary: "bg-secondary text-secondary-foreground rounded-full",
    destructive: "bg-destructive text-destructive-foreground rounded-full",
    outline: "rounded-full text-foreground border border-input",
    larger: "rounded-xl",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
