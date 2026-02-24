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

type SupabaseResult<T> = { data: T | null; error: any };

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
        return { data: null, error: err };
    }
}
