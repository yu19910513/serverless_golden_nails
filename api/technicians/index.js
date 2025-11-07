/**
 * @file Main API entry point for the /api/technicians root route.
 *
 * This file serves as the Vercel serverless function specifically for the
 * `/api/technicians` endpoint. It delegates the request to the
 * `getAllTechnicians` handler using an Express router instance.
 *
 * @module api/technicians/index
 */

import { createServerlessHandler } from '../_utils/helpers/createServerlessApp.js';
import { getAllTechnicians } from './_routes/getAllTechnicians.js';

/**
 * Creates and exports the Vercel serverless function for the /api/technicians base route.
 */
export default createServerlessHandler('/api/technicians', (router) => {
    /**
     * Route to get all active technicians.
     * @name GET /api/technicians/
     * @function
     * @memberof module:api/technicians/index
     * @inner
     * @param {Function} getAllTechnicians - Handler from `./_routes/getAllTechnicians.js`.
     */
    router.get("/", getAllTechnicians);
});