import { isValidString } from '../_utils/validate.js';
import { getMiscellaneousByTitle } from '../_utils/miscellaneous.js';
import { respond } from '../_utils/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  const { title } = req.query;
  if (!isValidString(title)) return respond.badRequest(res, "Invalid or missing 'title' parameter.");

  try {
    const item = await getMiscellaneousByTitle(title);
    if (!item) return respond.notFound(res, "This miscellaneous data is not found.");
    res.status(200).json(item);
  } catch (err) {
    console.error(err);
    respond.serverError(res, 'An internal server error occurred.');
  }
}
