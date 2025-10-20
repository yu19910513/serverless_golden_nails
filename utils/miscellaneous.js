// /utils/miscellaneous.js
import { supabase } from './supabaseClient.js';

/**
 * Fetches a miscellaneous record from the Supabase `miscellaneouses` table by its title.
 *
 * @async
 * @function getMiscellaneousByTitle
 * @param {string} title - The title of the miscellaneous record to fetch. Leading and trailing whitespace will be trimmed.
 * @returns {Promise<{title: string, context: string} | null>} 
 *   Returns a promise that resolves to an object containing `title` and `context` if found, or `null` if no record matches.
 * @throws {Error} Throws an error if the Supabase query fails.
 *
 * @example
 * const record = await getMiscellaneousByTitle('Welcome Message');
 * if (record) {
 *   console.log(record.context);
 * } else {
 *   console.log('No record found');
 * }
 */
export async function getMiscellaneousByTitle(title) {
    const { data, error } = await supabase
        .from('miscellaneouses')
        .select('title, context')
        .eq('title', title.trim())
        .limit(1);

    if (error) throw error;
    return data?.[0] || null;
}
