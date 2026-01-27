'use client';

/**
 * Toaster Component
 * 
 * Renders toast notifications from anywhere in the app.
 * Listens for custom toast events and manages toast lifecycle.
 * Place this component once in your root layout.
 */

import { useState, useEffect, useCallback } from 'react';
import { TOAST_EVENT, type Toast, type ToastType } from '@/lib/hooks/useToast';

// Maximum number of toasts to show at once
const MAX_TOASTS = 5;

// Icon components for each toast type
const icons: Record<ToastType, React.ReactNode> = {
    success: (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

// Background colors for each toast type
const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
};

// Text colors for each toast type
const textColors: Record<ToastType, string> = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
};

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const showTimer = setTimeout(() => setIsVisible(true), 10);

        // Auto-dismiss after duration
        const dismissTimer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(() => onDismiss(toast.id), 200);
        }, toast.duration);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(dismissTimer);
        };
    }, [toast.id, toast.duration, onDismiss]);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(() => onDismiss(toast.id), 200);
    };

    return (
        <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className={`
                flex items-center gap-3 p-4 border rounded-lg shadow-lg max-w-sm w-full
                transition-all duration-200 ease-out transform
                ${bgColors[toast.type]}
                ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            {/* Icon */}
            <div className="flex-shrink-0">
                {icons[toast.type]}
            </div>

            {/* Message */}
            <p className={`flex-1 text-sm font-medium ${textColors[toast.type]}`}>
                {toast.message}
            </p>

            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className={`flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition ${textColors[toast.type]}`}
                aria-label="Dismiss notification"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function Toaster() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const handleToast = (event: CustomEvent<Toast>) => {
            setToasts(prev => {
                // Limit the number of toasts
                const newToasts = [...prev, event.detail];
                if (newToasts.length > MAX_TOASTS) {
                    return newToasts.slice(-MAX_TOASTS);
                }
                return newToasts;
            });
        };

        window.addEventListener(TOAST_EVENT, handleToast as EventListener);
        return () => {
            window.removeEventListener(TOAST_EVENT, handleToast as EventListener);
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
            aria-label="Notifications"
        >
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={dismissToast}
                />
            ))}
        </div>
    );
}
