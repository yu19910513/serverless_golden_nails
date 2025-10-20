import { createClient } from '@supabase/supabase-js';

/**
 * @swagger
 * /api/miscellaneous/key:
 * get:
 * summary: Retrieves a specific miscellaneous item by its title.
 * description: >
 * Handles the GET request to fetch a single miscellaneous item from the Supabase `miscellaneouses` table
 * based on the provided title query parameter.
 * parameters:
 * - in: query
 * name: title
 * required: true
 * description: The title of the miscellaneous item to retrieve.
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Successfully retrieved the miscellaneous item.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * example: "API Key"
 * context:
 * type: string
 * example: "xyz-abc-123"
 * 400:
 * description: Bad Request. The 'title' query parameter is missing or invalid.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: "Invalid or missing 'title' parameter."
 * 404:
 * description: Not Found. The miscellaneous item with the specified title was not found.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: "This miscellaneous data is not found."
 * 405:
 * description: Method Not Allowed. Only GET requests are supported.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: "Method GET Not Allowed"
 * 500:
 * description: Internal Server Error.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: "An internal server error occurred."
 */

/**
 * Handles the GET request for /api/miscellaneous/key.
 * Fetches a single record from the 'miscellaneouses' table by title.
 *
 * @param {import('express').Request} req The Express request object, containing the query parameters.
 * @param {import('express').Response} res The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { title } = req.query;

    // Validate the presence and type of the 'title' query parameter.
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: "Invalid or missing 'title' parameter." });
    }

    // Initialize the Supabase client using environment variables.
    // This uses the anon key, which is suitable for public data access when Row Level Security (RLS) is enabled.
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Fetch the specific item from the 'miscellaneouses' table by title.
    const { data, error } = await supabase
      .from('miscellaneouses')
      .select('title, context')
      .eq('title', title.trim())
      .limit(1); // Ensure we only get one result for performance and predictability

    // Handle any errors that occur during the Supabase query.
    if (error) {
      console.error('Supabase query error:', error);
      // A database error is a server-side issue, so we return a 500 status.
      return res.status(500).json({ error: 'Failed to retrieve data from the database.' });
    }

    // If the query is successful but no data is found for the given title, return a 404.
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "This miscellaneous data is not found." });
    }

    // If data is found, return the first item in the array with a 200 OK status.
    const miscellaneous = data[0];
    return res.status(200).json(miscellaneous);

  } catch (err) {
    // Catch any other unexpected errors during the handler's execution.
    console.error('Handler execution error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}

