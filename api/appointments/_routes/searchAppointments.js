/**
 * @file Route handler for searching appointments.
 *
 * Implements the `GET /api/appointments/search` endpoint.
 * This handler searches for non-deleted appointments based on a keyword,
 * matching against customer, technician, and service fields.
 * @module api/appointments/_routes/searchAppointments
 */

import { supabase } from '../../_utils/supabaseClient.js';
import { respond } from '../../_utils/response.js';
import { DateTime } from 'luxon';

/**
 * Handles the GET /api/appointments/search request.
 *
 * Dynamically builds a Supabase query based on the provided `keyword`.
 *
 * - If a `keyword` is provided, it performs a case-insensitive search
 * (ilike) across customer name/phone/email, technician name, and service name.
 * - By default, it only returns appointments in the future (from the
 * current time in 'America/Los_Angeles').
 * - If `keyword` is `'**'`, it includes past appointments in the search.
 * - Results are ordered by date descending, then by start time ascending.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.query - The request query parameters.
 * @param {string} [req.query.keyword] - The search term. Can be a string,
 * '*' (all future), or '**' (all future and past).
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 * @throws {500} If a database error or other internal server error occurs.
 */
export async function searchAppointments(req, res) {
    const { keyword } = req.query;

    const searchKeyword = (keyword && keyword !== '*' && keyword !== '**') ? keyword.toLowerCase() : null;
    const includePast = (keyword === '**');

    try {
        let query = supabase
            .from('appointments')
            .select(`
                id,
                date,
                start_service_time,
                note,
                customer:customers (id, name, phone, email),
                technicians (id, name),
                services (id, name, time, price)
            `)
            .or('note.is.null,note.neq.deleted');

        if (searchKeyword) {
            const k = `%${searchKeyword}%`;
            query = query.or(
                `customer.name.ilike.${k},` +
                `customer.phone.ilike.${k},` +
                `customer.email.ilike.${k},` +
                `technicians.name.ilike.${k},` +
                `services.name.ilike.${k}`
            );
        }

        if (!includePast) {
            const seattleNow = DateTime.now().setZone("America/Los_Angeles");
            const today = seattleNow.toISODate(); // YYYY-MM-DD
            const nowTime = seattleNow.toFormat('HH:mm:ss'); // HH:mm:ss

            query = query.or(
                `date.gt.${today},` +
                `and(date.eq.${today},start_service_time.gte.${nowTime})`
            );
        }

        query = query.order('date', { ascending: false })
            .order('start_service_time', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;
        respond.ok(res, data);

    } catch (error) {
        console.error("Search error:", error);
        respond.serverError(res, 'Failed to search appointments.', error);
    }
}