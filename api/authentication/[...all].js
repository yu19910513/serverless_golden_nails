/**
 * @file Main API entry point for all authentication-related routes.
 *
 * This file serves as the Vercel serverless function for the `/api/authentication`
 * namespace. It uses a catch-all route (`[...all].js`) to capture all
 * requests under this path and delegates them to specific handlers using an
 * Express router instance provided by `createServerlessHandler`.
 *
 * @module api/authentication/[...all]
 */

import { createServerlessHandler } from '../_utils/helpers/createServerlessApp.js';
import { sendPasscode } from './_routes/sendPasscode.js';
import { verifyPasscode } from './_routes/verifyPasscode.js';

export default createServerlessHandler('/api/authentication', (router) => {
    /**
     * Route to send a one-time passcode to a user.
     * @name POST /api/authentication/send-passcode
     * @function
     * @memberof module:api/authentication/[...all]
     * @inner
     * @param {Function} sendPasscode - The handler function from `./_routes/sendPasscode.js`.
     */
    router.post('/send-passcode', sendPasscode);

    /**
     * Route to verify a one-time passcode and return a JWT.
     * @name POST /api/authentication/verify-passcode
     * @function
     * @memberof module:api/authentication/[...all]
     * @inner
     * @param {Function} verifyPasscode - The handler function from `./_routes/verifyPasscode.js`.
     */
    router.post('/verify-passcode', verifyPasscode);
});