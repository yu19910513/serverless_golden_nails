/**
 * @file Route handler for a customer's appointment history.
 *
 * Implements the `GET /api/appointments/customer_history` endpoint.
 * This handler fetches all non-deleted appointments for a specific customer.
 * @module api/appointments/_routes/getCustomerHistory
 */

import { supabase } from '../../_utils/supabaseClient.js';
import { respond } from '../../_utils/response.js';
import { groupAppointments } from '../../_utils/legacy/helper.js';

/**
 * Handles the GET /api/appointments/customer_history request.
 *
 * Fetches all non-deleted appointments for a specific customer, including
 * associated technician and service details. The results are then
 * processed by the `groupAppointments` helper before being sent.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.query - The request query parameters.
 * @param {string} req.query.customer_id - The ID of the customer whose history is to be fetched.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 * @throws {400} If the 'customer_id' query parameter is missing.
 * @throws {500} If a database error or other internal server error occurs.
 */
export async function getCustomerHistory(req, res) {
    const { customer_id } = req.query;
    if (!customer_id) {
        return respond.badRequest(res, 'Invalid or missing customer ID.');
    }

    try {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                date,
                start_service_time,
                note,
                technicians (id, name),
                services (id, name, time, price)
            `)
            .eq('customer_id', customer_id)
            .or('note.is.null,note.neq.deleted');

        if (error) throw error;

        respond.ok(res, groupAppointments(data));

    } catch (error) {
        console.error("Error fetching customer history:", error);
        respond.serverError(res, 'Failed to fetch appointments.', error);
    }
}