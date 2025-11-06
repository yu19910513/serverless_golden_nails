/**
 * @file Main API entry point for the /api/appointments root route.
 *
 * This file serves as the Vercel serverless function for the
 * `/api/appointments` endpoint. It delegates POST requests to the
 * `createAppointment` handler.
 *
 * @module api/appointments/index
 */

import { createServerlessHandler } from '../_utils/createServerlessApp.js';
import { create } from './_routes/createAppointment.js';

/**
 * Creates and exports the Vercel serverless function for the /api/appointments base route.
 */
export default createServerlessHandler('/api/appointments', (router) => {
    /**
     * Route to create a new appointment.
     * @name POST /api/appointments
     * @function
     * @memberof module:api/appointments/index
     * @inner
     * @param {Function} createAppointment - Handler from `./_routes/createAppointment.js`.
     */
    router.post("/", create);
});