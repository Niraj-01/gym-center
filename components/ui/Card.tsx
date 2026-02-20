
import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { motion, HTMLMotionProps } from "framer-motion"

const cardVariants = {
    default: "bg-card text-card-foreground shadow-sm border border-border/50",
    glass: "glass shadow-lg shadow-black/5",
    elevated: "bg-surface-elevated shadow-colored border-none"
}

const paddingVariants = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
}

interface CardProps extends HTMLMotionProps<"div"> {
    variant?: keyof typeof cardVariants
    padding?: keyof typeof paddingVariants
    hoverEffect?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", padding = "md", hoverEffect = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                className={cn(
                    "rounded-xl overflow-hidden transition-colors",
                    cardVariants[variant],
                    paddingVariants[padding],
                    hoverEffect && "hover:shadow-md hover:-translate-y-1 transition-all duration-300",
                    className
                )}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

export { Card }
