import { supabase } from './supabaseClient.js'; // Path to your Supabase client

/**
 * Fetches all categories and their non-deprecated services from Supabase.
 * This function performs an inner join to ensure only categories with at least
 * one active service are returned.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of
 * categories, each containing an array of its services.
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function getCategorizedServices() {
    const { data, error } = await supabase
        .from('categories')
        .select(
            `
      id,
      name,
      services!inner (
        id,
        name,
        description,
        price,
        time,
        category_id
      )
    `
        )
        // Filter the joined services to only include non-deprecated ones.
        .eq('services.deprecated', false)
        // Order the parent categories by their ID
        .order('id', { ascending: true })
        // Order the nested services within each category by their ID
        .order('id', { foreignTable: 'services', ascending: true });

    if (error) {
        console.error('Supabase error fetching categorized services:', error);
        throw error;
    }

    // Supabase's query result is already in the desired nested format,
    // so no extra mapping is needed.
    return data || [];
}

