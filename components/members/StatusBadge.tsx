'use client';

/**
 * StatusBadge - Pill badge component for member status
 */

import { MemberStatus, getStatusDisplay } from '@/lib/types/member';

interface StatusBadgeProps {
    status: MemberStatus;
    size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const { label, badgeClass } = getStatusDisplay(status);

    const sizeClasses = size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-3 py-1 text-xs';

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${badgeClass} ${sizeClasses}`}>
            {label}
        </span>
    );
}
