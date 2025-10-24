import { supabase } from './supabaseClient.js';

/**
 * Fetches all active technicians (status: true).
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of
 * technicians.
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function getAllActiveTechnicians() {
    const { data, error } = await supabase
        .from('technicians')
        .select('id, name, description')
        .eq('status', 1);

    if (error) {
        console.error('Supabase error fetching active technicians:', error);
        throw error;
    }
    return data || [];
}

/**
 * Fetches technicians who belong to ALL specified categories.
 *
 * @param {Number[]} categoryIds - An array of category IDs.
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of matching technicians.
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function getAvailableTechnicians(categoryIds) {
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('Category IDs are required.');
    }

    const { data, error } = await supabase
        .from('technicians')
        .select(`
      id,
      name,
      description,
      phone,
      unavailability,
      vacation_ranges,
      techniciancategory!inner(category_id)
    `)
        .eq('status', 1)
        .in('techniciancategory.category_id', categoryIds);

    if (error) {
        console.error('Supabase error fetching available technicians:', error);
        throw error;
    }

    // Only keep technicians that belong to ALL categoryIds
    const filtered = data.filter(
        tech =>
            Array.from(new Set(tech.techniciancategory.map(tc => tc.category_id))).length ===
            categoryIds.length
    );

    return filtered.map(({ techniciancategory, ...rest }) => rest);
}


/**
 * Fetches all active technicians and their non-deleted appointments
 * for a specific date.
 *
 * @param {String} date - The date to query (YYYY-MM-DD).
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of
 * technicians with their nested appointments and services.
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function getTechnicianSchedule(date) {
    const { data, error } = await supabase
        .from('technicians')
        .select(`
      id,
      name,
      appointments!left (
        id,
        date,
        services (
          id,
          name,
          time
        )
      )
    `)
        .eq('status', 1)
        .eq('appointments.date', date)
        .or('note.is.null,note.neq.deleted', { foreignTable: 'appointments' })
        .order('name', { ascending: true })
        .order('id', { foreignTable: 'appointments', ascending: true });

    if (error) {
        console.error('Supabase error fetching schedule:', error);
        throw error;
    }
    return data || [];
}