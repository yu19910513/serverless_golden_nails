import { createClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode'; // You may need to run `npm install jwt-decode`

/**
 * A helper function to check if the user has an 'admin' role from their JWT.
 * In a real-world scenario, you might have a more robust check, like calling a
 * database function (RPC) to verify the user's role against a 'profiles' table.
 * @param {string} token - The user's JWT.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
function isAdmin(token) {
    if (!token) return false;
    try {
        const decodedToken = jwtDecode(token);
        // This assumes your JWT payload has a custom claim like `app_metadata: { role: 'admin' }`
        // Adjust this line to match the actual structure of your JWT.
        return decodedToken?.app_metadata?.role === 'admin';
    } catch (error) {
        console.error("Invalid token:", error);
        return false;
    }
}

// Handles GET /api/miscellaneous
export default async function handler(req, res) {
    // This endpoint only supports GET requests.
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];

        // --- Admin Authorization Check ---
        if (!isAdmin(token)) {
            return res.status(403).json({ error: 'Forbidden: Admin access required.' });
        }

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.VITE_SUPABASE_ANON_KEY,
            {
                global: { headers: { Authorization: `Bearer ${token}` } },
            }
        );

        // Fetch all miscellaneous items
        const { data: miscellaneous, error } = await supabase
            .from('miscellaneous')
            .select('title, context');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'An internal server error occurred.' });
        }

        if (!miscellaneous || miscellaneous.length === 0) {
            return res.status(404).json({ message: "No data found." });
        }

        return res.status(200).json(miscellaneous);

    } catch (err) {
        console.error('Handler error:', err);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
