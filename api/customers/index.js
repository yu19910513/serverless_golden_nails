/**
 * @file Main API entry point for the /api/customers root route.
 *
 * This file serves as the Vercel serverless function for the
 * `/api/customers` endpoint. It delegates root requests (like PUT)
 * to specific handlers.
 *
 * @module api/customers/index
 */

import { createServerlessHandler } from '../_utils/createServerlessApp.js';
import { handleUpsertCustomer } from './_routes/upsertCustomer.js'; // Import the new handler name

/**
 * Creates and exports the Vercel serverless function for the /api/customers base route.
 */
export default createServerlessHandler('/api/customers', (router) => {
    /**
     * Route to create or update a customer.
     * @name PUT /api/customers
     * @function
     * @memberof module:api/customers/index
     * @inner
     * @param {Function} handleUpsertCustomer - Handler from `./_routes/upsertCustomer.js`.
     */
    router.put("/", handleUpsertCustomer); // Use the new handler name
});