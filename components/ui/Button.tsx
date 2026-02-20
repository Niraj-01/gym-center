
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"
import { motion, HTMLMotionProps } from "framer-motion"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                glass: "glass hover:bg-white/20 text-foreground border-transparent hover:border-white/20",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends Omit<HTMLMotionProps<"button">, "children" | "ref">,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
        // Cast strict variants to avoid type mismatch with framer-motion's elastic types
        const shineVariants = {
            initial: { x: "-100%" },
            hover: { x: "200%", transition: { duration: 0.5 } }
        }

        const Comp = asChild ? Slot : motion.button as any

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}

                ref={ref}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || props.disabled}
                initial="initial"
                whileHover="hover"
                {...props}
            >
                {variant === 'default' && !isLoading && (
                    <motion.div
                        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                        variants={shineVariants}
                    />
                )}

                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
