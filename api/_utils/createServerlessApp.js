import express from 'express';
import { basic_auth } from './legacy/authentication.js';

/**
 * Wraps an Express app into a Vercel serverless handler with a base path.
 *
 * @param {string} basePath - The base route path for all routes in this file.
 * @param {(router: import('express').Router) => void} mountRoutes - Function to mount routes onto the router.
 * @returns {(req, res) => void} Vercel serverless handler
 */
export function createServerlessHandler(basePath, mountRoutes) {
    const app = express();
    app.use(express.json());

    const router = express.Router();
    mountRoutes(router);

    // Mount the router at the base path
    app.use(basePath, basic_auth, router);

    return function handler(req, res) {
        return app(req, res);
    };
}
