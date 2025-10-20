import { createClient } from '@supabase/supabase-js';

// Handles GET /api/miscellaneous/key
export default async function handler(req, res) {
  console.log("api");

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) {
    //   return res.status(401).json({ error: "Authentication token not provided." });
    // }

    // Get the title from the query parameters
    const { title } = req.query;

    // Validate the title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: "Invalid or missing 'title' parameter." });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      // {
      //   global: { headers: { Authorization: `Bearer ${token}` } },
      // }
    );

    // Fetch the specific item by title
    const { data, error } = await supabase
      .from('miscellaneous')
      .select('title, context')
      .eq('title', title.trim());

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "This miscellaneous data is not found." });
    }

    const miscellaneous = data[0]; // take first match

    if (error || !miscellaneous) {
      // Supabase's .single() will return an error if no rows are found,
      // which we can use to send a 404 response.
      console.error('Supabase findOne error:', error);
      return res.status(404).json({ message: "This miscellaneous data is not found." });
    }

    return res.status(200).json(miscellaneous);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
