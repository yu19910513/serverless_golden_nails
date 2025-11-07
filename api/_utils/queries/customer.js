import { supabase } from '../helpers/supabaseClient.js'; // Path to your Supabase client

/**
 * Fetches a single customer by an exact phone number.
 *
 * @param {string} phone - The phone number to search for.
 * @returns {Promise<Object|null>} A promise that resolves to the customer
 * object or null if not found.
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function searchCustomerByPhone(phone) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle(); // Returns one record or null, exactly like findOne

    if (error) {
        console.error('Supabase error searching customer by phone:', error);
        throw error;
    }
    return data;
}

/**
 * Searches for customers by a keyword.
 * - If keyword is "*", returns all customers.
 * - If keyword is empty, returns an empty array.
 * - Otherwise, searches name, phone, and email.
 *
 * @param {string} keyword - The search term.
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of
 * matching customers.
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function smartSearchCustomers(keyword) {
    // 1. No keyword -> return empty array
    if (!keyword) {
        return [];
    }

    // 2. Keyword is "*" -> return all
    if (keyword === '*') {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, phone, email')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    // 3. Keyword is a search term -> use 'or' with 'ilike' (case-insensitive)
    const searchTerm = `%${keyword}%`;
    const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .order('name', { ascending: true });

    if (error) {
        console.error('Supabase error during smart search:', error);
        throw error;
    }
    return data || [];
}

/**
 * Fetches a single customer by an exact phone AND name match.
 *
 * @param {string} phone - The customer's phone number.
 * @param {string} name - The customer's name.
 * @returns {Promise<Object|null>} A promise that resolves to the customer
 * object or null if not found.
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function validateCustomer(phone, name) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .eq('name', name)
        .maybeSingle();

    if (error) {
        console.error('Supabase error validating customer:', error);
        throw error;
    }
    return data;
}

/**
 * Updates or creates a customer based on the original logic:
 * 1. If ID is provided, update by ID.
 * 2. If no ID, find by phone.
 * 3. If phone found, update that record.
 * 4. If phone not found, create a new record.
 *
 * @param {Object} customerData - The customer data.
 * @param {number} [customerData.id] - Optional ID for direct update.
 * @param {string} customerData.name - Customer name.
 * @param {string} customerData.phone - Customer phone.
 * @param {string} [customerData.email] - Optional email.
 * @param {boolean} [customerData.optInSms] - Optional SMS opt-in.
 * @returns {Promise<Object>} A promise resolving to { customer, status }
 * @throws {Error} Throws an error if the Supabase query fails.
 */
export async function upsertCustomer({ id, name, phone, email, optInSms }) {
    // Logic 1: Update by ID, if provided
    if (id) {
        // First, check if the customer exists
        const { data: existing, error: findError } = await supabase
            .from('customers')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (findError) throw findError;
        if (!existing) return { customer: null, status: 'not-found' };

        // If exists, update it
        const { data, error: updateError } = await supabase
            .from('customers')
            .update({ name, phone, email, optInSms })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;
        return { customer: data, status: 'updated-by-id' };
    }

    // Logic 2: No ID provided, so find by phone
    const { data: existingByPhone, error: findPhoneError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

    if (findPhoneError) throw findPhoneError;

    if (existingByPhone) {
        // Logic 3: Phone found, update that record
        // Note: The original logic doesn't update 'phone' here, only name/email/optIn.
        const { data, error: updateError } = await supabase
            .from('customers')
            .update({ name, email, optInSms })
            .eq('id', existingByPhone.id)
            .select()
            .single();

        if (updateError) throw updateError;
        return { customer: data, status: 'updated-by-phone' };
    } else {
        // Logic 4: Phone not found, create a new record
        const { data, error: createError } = await supabase
            .from('customers')
            .insert({ name, phone, email, optInSms })
            .select()
            .single();

        if (createError) throw createError;
        return { customer: data, status: 'created' };
    }
}