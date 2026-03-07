const { pool } = require("../config/db");

// GET ALL FORM RESPONSES (with related data)
const getFormResponses = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;

        const result = await pool.query(
            `
      SELECT 
        fr.id,
        fr.workspace_id,
        fr.booking_id,
        fr.template_id,
        fr.status,
        fr.token,
        fr.created_at,
        fr.updated_at,
        b.id as booking_id,
        b.contact_id,
        b.booking_type_id,
        c.id as contact_id,
        c.name as contact_name,
        c.email as contact_email,
        bt.id as booking_type_id,
        bt.name as booking_type_name,
        t.id as template_id,
        t.title as template_title,
        t.description as template_description
      FROM form_responses fr
      LEFT JOIN bookings b ON fr.booking_id = b.id
      LEFT JOIN contacts c ON b.contact_id = c.id
      LEFT JOIN booking_types bt ON b.booking_type_id = bt.id
      LEFT JOIN form_templates t ON fr.template_id = t.id
      WHERE fr.workspace_id = $1
      ORDER BY fr.created_at DESC
      LIMIT 200
      `,
            [workspaceId]
        );

        const responses = result.rows.map((row) => ({
            id: row.id,
            workspaceId: row.workspace_id,
            bookingId: row.booking_id,
            templateId: row.template_id,
            status: row.status,
            token: row.token,          // ← was missing
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            booking: row.booking_id ? {
                id: row.booking_id,
                contactId: row.contact_id,
                bookingTypeId: row.booking_type_id,
                contact: {
                    id: row.contact_id,
                    name: row.contact_name,
                    email: row.contact_email,
                },
                bookingType: {
                    id: row.booking_type_id,
                    name: row.booking_type_name,
                },
            } : null,
            template: row.template_id ? {
                id: row.template_id,
                title: row.template_title,
                description: row.template_description,
            } : null,
        }));

        res.json({ responses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// SEND FORM REMINDER (create alert)
const remindFormResponse = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;
        const id = Number(req.params.id);

        const frResult = await pool.query(
            `
      SELECT fr.id, fr.workspace_id, t.title
      FROM form_responses fr
      JOIN form_templates t ON fr.template_id = t.id
      WHERE fr.id = $1 AND fr.workspace_id = $2
      `,
            [id, workspaceId]
        );

        if (frResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const fr = frResult.rows[0];

        await pool.query(
            `
      INSERT INTO alerts (workspace_id, severity, type, title, body, link_path, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
            [workspaceId, "INFO", "FORM_REMINDER", "Form reminder requested", `Reminder for form: ${fr.title}`, "/forms"]
        );

        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getFormResponses,
    remindFormResponse,
};