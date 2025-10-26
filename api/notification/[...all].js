/**
 * @file Main API entry point for all notification routes.
 *
 * This file serves as the Vercel serverless function for `/api/notification/*`
 * routes. It uses a catch-all `[...all].js` to delegate all sub-routes
 * to specific handlers using an Express router instance.
 *
 * @module api/notification/[...all]
 */

import { createServerlessHandler } from '../_utils/createServerlessApp.js';
import { postContact } from './_routes/contact.js';
import { postNotify } from './_routes/notify.js';

export default createServerlessHandler('/api/notification', (router) => {
    /**
     * Route to handle client contact form.
     * @name POST /api/notification/contact
     * @function
     * @memberof module:api/notification/[...all]
     * @inner
     * @param {Function} postContact - The handler function from `./_routes/contact.js`.
     */
    router.post('/contact', postContact);

    /**
     * Route to handle appointment notifications.
     * @name POST /api/notification/notify
     * @function
     * @memberof module:api/notification/[...all]
     * @inner
     * @param {Function} postNotify - The handler function from `./_routes/notify.js`.
     */
    router.post('/notify', postNotify);
});