/**
 * @file Main API entry point for technician sub-routes.
 *
 * This file serves as the Vercel serverless function for all routes under
 * the /api/technicians namespace that are not handled by index.js
 * (e.g., /api/technicians/available). It delegates requests to specific
 * handlers using an Express router instance.
 *
 * @module api/technicians/[...all]
 */

import { createServerlessHandler } from '../_utils/createServerlessApp.js';

import { getAvailable } from './_routes/getAvailable.js';
import { getSchedule } from './_routes/getSchedule.js';

/**
 * Creates and exports the Vercel serverless function for the /api/technicians sub-routes.
 */
export default createServerlessHandler('/api/technicians', (router) => {

    /**
     * Route to get available technicians by category.
     * @name POST /api/technicians/available
     * @function
     * @memberof module:api/technicians/[...all]
     * @inner
     * @param {Function} getAvailable - Handler from `./_routes/getAvailable.js`.
     */
    router.post('/available', getAvailable);

    /**
     * Route to get a technician's schedule.
     * @name GET /api/technicians/schedule
     * @function
     * @memberof module:api/technicians/[...all]
     * @inner
     * @param {Function} getSchedule - Handler from `./_routes/getSchedule.js`.
     */
    router.get('/schedule', getSchedule);
});