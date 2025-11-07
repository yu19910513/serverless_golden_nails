/**
 * @file Main API entry point for the services route.
 *
 * This file serves as the Vercel serverless function for the `/api/services`
 * route. It uses `index.js` to handle the exact root path and
 * delegates it to a specific handler using an Express router
 * instance provided by `createServerlessHandler`.
 *
 * @module api/services/index
 */

import { createServerlessHandler } from '../_utils/helpers/createServerlessApp.js';
import { getServices } from './_routes/index.js';

export default createServerlessHandler('/api/services', (router) => {
    /**
     * Route to get all categorized services.
     * @name GET /api/services
     * @function
     * @memberof module:api/services/index
     * @inner
     * @param {Function} getServices - The handler function from `./_routes/index.js`.
     */
    router.get('/', getServices);
});