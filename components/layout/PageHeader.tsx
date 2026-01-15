'use client';

/**
 * PageHeader - Consistent page header pattern for all admin pages
 */

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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
            <div>
                <h1 className="text-2xl font-semibold text-black">{title}</h1>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </div>

            {(actionLabel || secondaryActionLabel) && (
                <div className="flex items-center gap-3">
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className="px-4 py-2.5 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                        >
                            {secondaryActionLabel}
                        </button>
                    )}
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
