/**
 * Toast Hook
 * 
 * Provides a simple API for showing toast notifications.
 * Uses a custom event-based system to communicate with the Toaster component.
 */

import { useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
    type?: ToastType;
    duration?: number; // milliseconds, default 4000
    id?: string;
}

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

// Custom event name for toast communication
const TOAST_EVENT = 'gymcentre:toast';

/**
 * Dispatch a toast event to be picked up by the Toaster component
 */
function dispatchToast(toast: Toast): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }));
    }
}

/**
 * Generate a unique ID for each toast
 */
function generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for showing toast notifications
 * 
 * Usage:
 * const toast = useToast();
 * toast.success('Member added successfully');
 * toast.error('Failed to delete member');
 */
export function useToast() {
    const show = useCallback((message: string, options: ToastOptions = {}) => {
        const toast: Toast = {
            id: options.id || generateId(),
            message,
            type: options.type || 'info',
            duration: options.duration || 4000,
        };
        dispatchToast(toast);
    }, []);

    const success = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
        show(message, { ...options, type: 'success' });
    }, [show]);

    const error = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
        show(message, { ...options, type: 'error' });
    }, [show]);

    const warning = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
        show(message, { ...options, type: 'warning' });
    }, [show]);

    const info = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
        show(message, { ...options, type: 'info' });
    }, [show]);

    return { show, success, error, warning, info };
}

/**
 * Standalone toast function for use outside of React components
 * (e.g., in utility functions or callbacks)
 */
export const toast = {
    show: (message: string, options: ToastOptions = {}) => {
        dispatchToast({
            id: options.id || generateId(),
            message,
            type: options.type || 'info',
            duration: options.duration || 4000,
        });
    },
    success: (message: string, duration?: number) => {
        toast.show(message, { type: 'success', duration });
    },
    error: (message: string, duration?: number) => {
        toast.show(message, { type: 'error', duration });
    },
    warning: (message: string, duration?: number) => {
        toast.show(message, { type: 'warning', duration });
    },
    info: (message: string, duration?: number) => {
        toast.show(message, { type: 'info', duration });
    },
};

// Re-export types and event name for Toaster component
export { TOAST_EVENT };
