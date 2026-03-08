
'use client';

import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from "framer-motion"

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
    tiltEffect?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", padding = "md", hoverEffect = false, tiltEffect = false, ...props }, ref) => {
        const x = useMotionValue(0);
        const y = useMotionValue(0);

        const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), { stiffness: 300, damping: 30 });
        const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), { stiffness: 300, damping: 30 });

        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!tiltEffect) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
            const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
            x.set(normalizedX);
            y.set(normalizedY);
        };

        const handleMouseLeave = () => {
            if (!tiltEffect) return;
            x.set(0);
            y.set(0);
        };

        return (
            <motion.div
                ref={ref}
                className={cn(
                    "rounded-xl overflow-hidden transition-colors light-sweep-card",
                    cardVariants[variant],
                    paddingVariants[padding],
                    hoverEffect && "hover:shadow-md hover:-translate-y-1 transition-all duration-300",
                    tiltEffect && "perspective-card",
                    className
                )}
                style={tiltEffect ? { rotateX, rotateY, transformPerspective: 800 } : undefined}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

export { Card }
