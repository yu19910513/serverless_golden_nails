/**
 * @file Main API entry point for the /api/miscellaneouses namespace.
 *
 * This file serves as the Vercel serverless function for the
 * `/api/miscellaneouses` endpoint. It delegates root GET requests
 * to specific handlers using an Express router instance.
 *
 * @module api/miscellaneous/index
 */

import { createServerlessHandler } from '../_utils/createServerlessApp.js';
import { handleGetMiscByTitle } from './_routes/getMiscByTitle.js';

/**
 * Creates and exports the Vercel serverless function for the /api/miscellaneouses base route.
 */
export default createServerlessHandler('/api/miscellaneouses', (router) => {
    /**
     * Route to get a miscellaneous item.
     * (Note: This route is /key but uses the 'handleGetMiscByTitle' handler)
     *
     * @name GET /api/miscellaneouses/key
     * @function
     * @memberof module:api/miscellaneous/index
     * @inner
     * @param {Function} handleGetMiscByTitle - Handler from `./_routes/getMiscByTitle.js`.
     */
    router.get("/key", handleGetMiscByTitle);
});