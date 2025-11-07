/**
 * @file Route handler for a customer's appointment history.
 *
 * Implements the `GET /api/appointments/customer_history` endpoint.
 * This handler fetches all non-deleted appointments for a specific customer.
 * @module api/appointments/_routes/getCustomerHistory
 */

import { fetchCustomerHistory } from '../../_utils/queries/appointment.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the GET /api/appointments/customer_history request.
 *
 * Validates the 'customer_id' and delegates all fetching and
 * processing logic to the `fetchCustomerHistory` helper.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {string} req.query.customer_id - The ID of the customer.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export async function getCustomerHistory(req, res) {
    const { customer_id } = req.query;

    // 1. Request Validation
    if (!customer_id) {
        return respond.badRequest(res, 'Invalid or missing customer ID.');
    }

    try {
        // 2. Delegate Business Logic
        const historyData = await fetchCustomerHistory(customer_id);

        // 3. Send Success Response
        return respond.ok(res, historyData);

    } catch (error) {
        // 4. Handle Errors
        console.error("Error fetching customer history:", error);
        return respond.serverError(res, 'Failed to fetch appointments.', error);
    }
}