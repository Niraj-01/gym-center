/**
 * Safe Supabase Query Wrapper
 *
 * Wraps any Supabase query with consistent error handling and logging.
 * Use this for all data fetching to ensure errors are caught and reported uniformly.
 *
 * Usage:
 *   const { data, error } = await safeQuery(() =>
 *     supabase.from('members').select('*')
 *   );
 */

interface SupabaseError {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
}

type SupabaseResult<T> = { data: T | null; error: SupabaseError | null };

export async function safeQuery<T>(
    fn: () => Promise<SupabaseResult<T>>
): Promise<SupabaseResult<T>> {
    try {
        const { data, error } = await fn();

        if (error) {
            console.error('[Supabase Error]', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            });
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[Unexpected Error]', err);
        return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
}
