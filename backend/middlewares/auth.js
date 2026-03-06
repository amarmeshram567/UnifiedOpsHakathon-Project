const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

function requireAuth() {
    return async (req, res, next) => {
        try {
            const header = req.headers.authorization || "";
            const token = header.startsWith("Bearer ")
                ? header.slice(7)
                : null;

            if (!token) {
                return res.status(401).json({ error: "Missing auth token" });
            }

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return res.status(500).json({ error: "JWT_SECRET not configured" });
            }

            // ✅ Verify JWT
            const decoded = jwt.verify(token, secret);
            //const userId = decoded && decoded.id;   // must match login payload

            const userId = decoded.id || decoded.userId;

            if (!userId) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // ✅ Fetch user from PostgreSQL
            const result = await pool.query(
                "SELECT id, name, email FROM users WHERE id = $1",
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: "User not found" });
            }

            // Attach user to request
            req.user = result.rows[0];

            next();

        } catch (err) {
            console.error(err.message);
            return res.status(401).json({ error: "Invalid token" });
        }
    };
}

module.exports = {
    requireAuth
};