'use client';

/**
 * PageHeader - Consistent page header pattern for all admin pages
 * Enhanced with shimmer title, entrance animation, and springy action buttons.
 */

import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export function PageHeader({
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}: PageHeaderProps) {
    return (
        <motion.div
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#E2D9C9]/80"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
            <div>
                <h1
                    className="text-[#1A1A1A]"
                    style={{ fontFamily: "'Zilla Slab', serif", fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}
                >
                    {title}
                </h1>
                {description && (
                    <motion.p
                        className="text-sm text-[#1A1A1A]/55 mt-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        {description}
                    </motion.p>
                )}
            </div>

            {(actionLabel || secondaryActionLabel) && (
                <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                >
                    {secondaryActionLabel && onSecondaryAction && (
                        <motion.button
                            onClick={onSecondaryAction}
                            className="px-5 py-2.5 border border-[#1A1A1A]/20 text-sm text-[#1A1A1A]/80 hover:bg-white hover:border-[#1A1A1A]/30 rounded-[10px] transition-colors font-medium"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                            whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {secondaryActionLabel}
                        </motion.button>
                    )}
                    {actionLabel && onAction && (
                        <motion.button
                            onClick={onAction}
                            className="px-6 py-2.5 bg-[#1A1A1A] text-[#F5F2ED] hover:bg-[#2D6A4F] rounded-[10px] transition-colors"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                            whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {actionLabel}
                        </motion.button>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
