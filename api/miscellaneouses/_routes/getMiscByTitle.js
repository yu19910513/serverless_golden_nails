import { isValidString } from '../../_utils/helpers/validate.js';
import { getMiscellaneousByTitle } from '../../_utils/queries/miscellaneous.js';
import { respond } from '../../_utils/helpers/response.js';

/**
 * Handles the request to get a miscellaneous item by its title.
 * The title is expected as a query parameter.
 *
 * @api {get} /api/miscellaneouses/key Get miscellaneous item by title
 * @apiName GetMiscellaneousByTitle
 * @apiGroup Miscellaneous
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function handleGetMiscByTitle(req, res) {
    const { title } = req.query;
    if (!isValidString(title)) {
        return respond.badRequest(res, "Invalid or missing 'title' parameter.");
    }

    try {
        const item = await getMiscellaneousByTitle(title);
        if (!item) {
            return respond.notFound(res, "This miscellaneous data is not found.");
        }
        res.status(200).json(item);
    } catch (err) {
        console.error(err);
        respond.serverError(res, 'An internal server error occurred.');
    }
}