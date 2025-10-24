/**
 * @file Route handler for the daily calendar view.
 *
 * Implements the `GET /api/appointments/calender` endpoint.
 * This handler fetches all appointments for a given date and
 * groups them by the technician assigned to them.
 * @module api/appointments/_routes/getCalendar
 */

import { supabase } from '../../_utils/supabaseClient.js';
import { respond } from '../../_utils/response.js';

/**
 * Handles the GET /api/appointments/calender request.
 *
 * Fetches all non-deleted appointments for a specific date, including
 * associated customer, technician, and service data. The flat list of
 * appointments is then processed and returned as an array, where each
 * element is a technician object containing a list of their appointments
 * for that day.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {object} req.query - The request query parameters.
 * @param {string} req.query.date - The date to fetch appointments for (e.g., 'YYYY-MM-DD').
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 * @throws {400} If the 'date' query parameter is missing.
 * @throws {500} If a database error or other internal server error occurs.
 */
export async function getCalendar(req, res) {
    const { date } = req.query;
    if (!date) {
        return respond.badRequest(res, 'Date parameter is required.');
    }

    try {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                id,
                date,
                start_service_time,
                customer:customers (id, name),
                technicians (id, name),
                services (id, name, time)
            `)
            .eq('date', date)
            .or('note.is.null,note.neq.deleted');

        if (error) throw error;

        const groupedByTechnician = appointments.reduce((acc, appointment) => {
            if (!appointment.technicians || appointment.technicians.length === 0) return acc;

            appointment.technicians.forEach((technician) => {
                if (!acc[technician.id]) {
                    acc[technician.id] = {
                        id: technician.id,
                        name: technician.name,
                        appointments: [],
                    };
                }

                appointment.customer = appointment.customer;
                acc[technician.id].appointments.push(appointment);
            });
            return acc;
        }, {});

        const groupedArray = Object.values(groupedByTechnician);
        respond.ok(res, groupedArray);

    } catch (error) {
        console.error("Error fetching calendar appointments:", error);
        respond.serverError(res, 'Failed to fetch appointments.', error);
    }
}