/**
 * @file Main API entry point for all appointment-related routes.
 *
 * This file serves as the Vercel serverless function for the `/api/appointments`
 * namespace. It uses a catch-all route (`[...all].js`) to capture all
 * requests under this path and delegates them to specific handlers using an
 * Express router instance provided by `createServerlessHandler`.
 *
 * @module api/appointments/[...all]
 */

import { createServerlessHandler } from '../_utils/createServerlessApp.js';

import { getUpcoming } from './_routes/getUpcoming.js';
import { getCalendar } from './_routes/getCalendar.js';
import { getCustomerHistory } from './_routes/getCustomerHistory.js';
import { updateNote } from './_routes/updateNote.js';
import { searchAppointments } from './_routes/searchAppointments.js';
import { findAlternativeTechs } from './_routes/findAlternativeTechs.js';
import { updateTechnician } from './_routes/updateTechnician.js';

/**
 * Creates and exports the Vercel serverless function for the /api/appointments namespace.
 * This function initializes an Express router and mounts all appointment-related sub-routes.
 *
 * @param {string} '/api/appointments' - The base path for this router.
 * @param {Function} routerCallback - A callback function that receives an Express router instance.
 * @returns {Function} A Vercel serverless request handler.
 */
export default createServerlessHandler('/api/appointments', (router) => {
    /**
     * Route to fetch upcoming appointments for a technician.
     * @name GET /api/appointments/upcoming
     * @function
     * @memberof module:api/appointments/[...all]
     * @inner
     * @param {Function} getUpcoming - Handler from `./_routes/getUpcoming.js`.
     */
    router.get('/upcoming', getUpcoming);

    /**
     * Route to fetch appointments for a specific date, grouped by technician.
     * @name GET /api/appointments/calender
     * @function
     * @memberof module:api/appointments/[...all]
     * @inner
     * @param {Function} getCalendar - Handler from `./_routes/getCalendar.js`.
     */
    router.get('/calender', getCalendar);

    /**
     * Route to fetch all non-deleted appointments for a specific customer.
     * @name GET /api/appointments/customer_history
     * @function
     * @memberof module:api/appointments/[...all]
     * @inner
     * @param {Function} getCustomerHistory - Handler from `./_routes/getCustomerHistory.js`.
     */
    router.get('/customer_history', getCustomerHistory);

    /**
     * Route to search for appointments based on a keyword.
     * @name GET /api/appointments/search
     * @function
     * @memberof module:api/appointments/[...all]
     * @inner
     * @param {Function} searchAppointments - Handler from `./_routes/searchAppointments.js`.
     */
    router.get('/search', searchAppointments);

    /**
     * Route to find available technicians for a given appointment time.
     * @name GET /api/appointments/find_alternative_techs
     * @function
     * @memberof module:api/appointments/[...all]
     * @inner
     * @param {Function} findAlternativeTechs - Handler from `./_routes/findAlternativeTechs.js`.
     */
    router.get('/find_alternative_techs', findAlternativeTechs);

    /**
     * Route to update the note field of a specific appointment.
     * @name PUT /api/appointments/update_note
     * @function
     * @memberof module:api/appointments/[...all]
     * @inner
     * @param {Function} updateNote - Handler from `./_routes/updateNote.js`.
     */
    router.put('/update_note', updateNote);

    /**
     * Route to update the technician assigned to an appointment.
     * @name PUT /api/appointments/update_technician
     * @function
     * @memberof module:api/appointments/[...all]
     * @inner
     * @param {Function} updateTechnician - Handler from `./_routes/updateTechnician.js`.
     */
    router.put('/update_technician', updateTechnician);
});