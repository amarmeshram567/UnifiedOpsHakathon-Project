const { z } = require('zod');
const { pool } = require('../config/db');


// ✅ GET ALL BOOKINGS
const getAllBookings = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;

        const result = await pool.query(
            `
      SELECT 
        b.*,
        c.name AS contact_name,
        c.email AS contact_email,
        bt.name AS booking_type_name,
        bt.duration_min
      FROM bookings b
      JOIN contacts c ON b.contact_id = c.id
      JOIN booking_types bt ON b.booking_type_id = bt.id
      WHERE b.workspace_id = $1
      ORDER BY b.start_at ASC
      LIMIT 200
      `,
            [workspaceId]
        );

        res.json({ bookings: result.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};


// ✅ UPDATE BOOKING STATUS
const updateBookingStatus = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;
        const id = Number(req.params.id);

        const schema = z.object({
            status: z.enum(["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"])
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        // Check if booking exists for this workspace
        const bookingCheck = await pool.query(
            "SELECT * FROM bookings WHERE id = $1 AND workspace_id = $2",
            [id, workspaceId]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        // Update status
        const updated = await pool.query(
            `
      UPDATE bookings
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
            [parsed.data.status, id]
        );

        res.json({ booking: updated.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = {
    getAllBookings,
    updateBookingStatus
}