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
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 pb-6 border-b border-gray-200"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <div>
                <h1 className="text-2xl font-semibold text-black animate-shimmer-text">{title}</h1>
                {description && (
                    <motion.p
                        className="text-sm text-gray-500 mt-1"
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
                            className="px-4 py-2.5 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                            whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {secondaryActionLabel}
                        </motion.button>
                    )}
                    {actionLabel && onAction && (
                        <motion.button
                            onClick={onAction}
                            className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm animate-pulse-glow"
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
