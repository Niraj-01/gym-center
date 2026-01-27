/**
 * Logger Utility
 * 
 * Provides logging functions that automatically disable in production.
 * This prevents sensitive information from being exposed in browser consoles
 * while allowing detailed debugging during development.
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Log informational messages (only in development)
 */
export function log(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.log(message, ...args);
    }
}

/**
 * Log warning messages (only in development)
 */
export function warn(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.warn(message, ...args);
    }
}

/**
 * Log error messages (only in development)
 * 
 * Note: Even in production, we might want to track errors
 * via a service like Sentry. For now, we suppress to console.
 */
export function error(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.error(message, ...args);
    }
    // In production, you could send to an error tracking service:
    // if (!isDev) { sendToErrorTracker(message, args); }
}

/**
 * Log debug information with a tag prefix (only in development)
 * Useful for categorizing logs by feature/module
 */
export function debug(tag: string, message: string, ...args: unknown[]): void {
    if (isDev) {
        console.log(`[${tag}]`, message, ...args);
    }
}

/**
 * Logger object for use in components and server actions
 * Provides a consistent API for logging throughout the app
 */
export const logger = {
    log,
    warn,
    error,
    debug,

    /**
     * Log success message with checkmark (development only)
     */
    success: (message: string, ...args: unknown[]): void => {
        if (isDev) {
            console.log('✅', message, ...args);
        }
    },

    /**
     * Log failure message with X (development only)
     */
    fail: (message: string, ...args: unknown[]): void => {
        if (isDev) {
            console.error('❌', message, ...args);
        }
    },
};

export default logger;
