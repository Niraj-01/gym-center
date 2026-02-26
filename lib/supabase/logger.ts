// Supabase Query Logger for debugging
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class SupabaseLogger {
    private isDev = process.env.NODE_ENV === 'development';

    log(level: LogLevel, message: string, data?: unknown) {
        if (!this.isDev) return;

        const colors = {
            info: '\x1b[36m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            debug: '\x1b[35m'
        };

        console.log(`${colors[level]}[SUPABASE ${level.toUpperCase()}]\x1b[0m ${message}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    }

    query(table: string, operation: string) {
        this.log('info', `Query: ${operation} on ${table}`);
    }

    success(table: string, operation: string, rowCount?: number) {
        this.log('info', `✅ Success: ${operation} on ${table}${rowCount !== undefined ? ` (${rowCount} rows)` : ''}`);
    }

    error(table: string, operation: string, error: Record<string, unknown>) {
        this.log('error', `❌ Error: ${operation} on ${table}`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
    }
}

export const supabaseLogger = new SupabaseLogger();
