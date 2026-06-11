import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "glass-btn-primary",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 active:scale-95 shadow-md shadow-destructive/10 hover:shadow-destructive/20",
    outline: "glass-btn-outline",
    secondary: "glass-btn-secondary",
    ghost: "hover:bg-primary/10 hover:text-primary transition-all duration-200 active:scale-95",
    link: "text-primary underline-offset-4 hover:underline",
  }
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-xl px-3",
    lg: "h-11 rounded-xl px-8",
    icon: "h-10 w-10",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
