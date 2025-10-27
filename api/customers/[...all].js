/**
 * @file Main API entry point for all customer-related routes.
 *
 * This file serves as the Vercel serverless function for the `/api/customers`
 * namespace. It delegates requests to specific handlers using an
 * Express router instance.
 *
 * @module api/customers/[...all]
 */

import { createServerlessHandler } from '../_utils/createServerlessApp.js';

import { searchCustomer } from './_routes/searchCustomer.js';
import { smartSearch } from './_routes/smartSearch.js';
import { validate } from './_routes/validateCustomer.js';

/**
 * Creates and exports the Vercel serverless function for the /api/customers namespace.
 */
export default createServerlessHandler('/api/customers', (router) => {
    /**
     * Route to search for a customer by phone number.
     * @name GET /api/customers/search
     * @function
     * @memberof module:api/customers/[...all]
     * @inner
     * @param {Function} searchCustomer - Handler from `./_routes/searchCustomer.js`.
     */
    router.get('/search', searchCustomer);

    /**
     * Route to smart search for customers by keyword.
     * @name GET /api/customers/smart_search
     * @function
     * @memberof module:api/customers/[...all]
     * @inner
     * @param {Function} smartSearch - Handler from `./_routes/smartSearch.js`.
     */
    router.get('/smart_search', smartSearch);

    /**
     * Route to validate a customer by matching phone and name.
     * @name GET /api/customers/validate
     * @function
     * @memberof module:api/customers/[...all]
     * @inner
     * @param {Function} validate - Handler from `./_routes/validateCustomer.js`.
     */
    router.get('/validate', validate);
});