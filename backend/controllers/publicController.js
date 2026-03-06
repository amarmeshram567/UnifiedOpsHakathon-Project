const { z } = require("zod");
const { pool } = require("../config/db");
const { onBookingCreated, onNewContact } = require("../automation/engine");



// Public workspace info 
const getPublicWorkspaceInfo = async (req, res) => {
    try {
        const workspace = await pool.query(
            `
      SELECT w.id, w.slug, w.name, w.address, w.time_zone, w.contact_email, w.active,
             (SELECT json_agg(json_build_object('id', id, 'name', name, 'durationMin', duration_min))
              FROM booking_types WHERE workspace_id = w.id) as booking_types,
             cfs.enabled as contact_form_enabled
      FROM workspaces w
      LEFT JOIN contact_form_settings cfs ON cfs.workspace_id = w.id
      WHERE w.slug = $1 AND w.active = true
      `,
            [req.params.slug]
        );

        if (workspace.rows.length === 0) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const ws = workspace.rows[0];
        res.json({
            workspace: {
                id: ws.id,
                slug: ws.slug,
                name: ws.name,
                address: ws.address,
                timeZone: ws.time_zone,
                contactEmail: ws.contact_email,
                bookingTypes: ws.booking_types || [],
                contactFormEnabled: ws.contact_form_enabled ?? false,
            },
        });
    } catch (error) {
        console.error("Error fetching workspace:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


// Submit contact form
const submitContactForm = async (req, res) => {
    try {
        const workspace = await pool.query(
            `
      SELECT w.id, w.active, cfs.enabled 
      FROM workspaces w
      LEFT JOIN contact_form_settings cfs ON cfs.workspace_id = w.id
      WHERE w.slug = $1
      `,
            [req.params.slug]
        );

        if (workspace.rows.length === 0 || !workspace.rows[0].active) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const ws = workspace.rows[0];
        if (!ws.enabled) {
            return res.status(403).json({ error: "Contact form disabled" });
        }

        const schema = z.object({
            name: z.string().min(1),
            email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
            phone: z.string().min(5).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
            message: z.string().optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        if (!parsed.data.email && !parsed.data.phone) {
            return res.status(400).json({ error: "Email or phone is required" });
        }

        const { name, email, phone, message } = parsed.data;
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Create contact
            const contactResult = await client.query(
                `
        INSERT INTO contacts (workspace_id, name, email, phone, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
        `,
                [ws.id, name, email || null, phone || null]
            );
            const contactId = contactResult.rows[0].id;

            // Create conversation
            const convResult = await client.query(
                `
        INSERT INTO conversations (workspace_id, contact_id, created_at)
        VALUES ($1, $2, NOW())
        RETURNING id
        `,
                [ws.id, contactId]
            );
            const conversationId = convResult.rows[0].id;

            // Create initial message if provided
            if (message?.trim()) {
                await client.query(
                    `
          INSERT INTO messages (conversation_id, direction, channel_type, body, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          `,
                    [conversationId, "INBOUND", email ? "EMAIL" : "SMS", message]
                );
                await client.query(
                    `UPDATE conversations SET last_inbound_at = NOW() WHERE id = $1`,
                    [conversationId]
                );
            }

            await client.query("COMMIT");

            // Trigger automation outside transaction
            await onNewContact({ workspaceId: ws.id, contactId, conversationId });

            res.json({ ok: true });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error submitting contact form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}



// Get Availability for booking type 
const getAvailability = async (req, res) => {
    try {
        const workspace = await pool.query(
            `SELECT id, active FROM workspaces WHERE slug = $1`,
            [req.params.slug]
        );

        if (workspace.rows.length === 0 || !workspace.rows[0].active) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const availability = await pool.query(
            `
      SELECT id, day_of_week, start_time, end_time
      FROM availability
      WHERE workspace_id = $1
      ORDER BY day_of_week ASC
      `,
            [workspace.rows[0].id]
        );

        res.json({
            availability: availability.rows.map((a) => ({
                id: a.id,
                dayOfWeek: a.day_of_week,
                startTime: a.start_time,
                endTime: a.end_time,
            })),
        });
    } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


// Create booking 
const createBooking = async (req, res) => {
    try {
        const workspace = await pool.query(
            `SELECT id, active FROM workspaces WHERE slug = $1`,
            [req.params.slug]
        );

        if (workspace.rows.length === 0 || !workspace.rows[0].active) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const wsId = workspace.rows[0].id;

        const schema = z.object({
            bookingTypeId: z.number().int(),
            startAt: z.string().datetime(),
            name: z.string().min(1),
            email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
            phone: z.string().min(5).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        if (!parsed.data.email && !parsed.data.phone) {
            return res.status(400).json({ error: "Email or phone is required" });
        }

        // Verify booking type exists
        const bookingType = await pool.query(
            `SELECT id, duration_min FROM booking_types WHERE id = $1 AND workspace_id = $2`,
            [parsed.data.bookingTypeId, wsId]
        );
        if (bookingType.rows.length === 0) {
            return res.status(400).json({ error: "Invalid booking type" });
        }

        const bt = bookingType.rows[0];
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Create contact
            const contactResult = await client.query(
                `
        INSERT INTO contacts (workspace_id, name, email, phone, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
        `,
                [wsId, parsed.data.name, parsed.data.email || null, parsed.data.phone || null]
            );
            const contactId = contactResult.rows[0].id;

            // Create conversation
            const convResult = await client.query(
                `
        INSERT INTO conversations (workspace_id, contact_id, created_at)
        VALUES ($1, $2, NOW())
        RETURNING id
        `,
                [wsId, contactId]
            );
            const conversationId = convResult.rows[0].id;

            // Create booking
            const startAt = new Date(parsed.data.startAt);
            const endAt = new Date(startAt.getTime() + bt.duration_min * 60 * 1000);

            const bookingResult = await client.query(
                `
        INSERT INTO bookings (workspace_id, contact_id, booking_type_id, start_at, end_at, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, start_at, end_at
        `,
                [wsId, contactId, parsed.data.bookingTypeId, startAt, endAt]
            );
            const booking = bookingResult.rows[0];

            await client.query("COMMIT");

            // Trigger automation outside transaction
            await onBookingCreated({ workspaceId: wsId, bookingId: booking.id });

            res.json({
                ok: true,
                booking: { id: booking.id, startAt: booking.start_at, endAt: booking.end_at },
                next: { forms: `/w/${req.params.slug}/forms/${booking.id}` },
            });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}




// Get forms for booking
const getFormBooking = async (req, res) => {
    try {
        const workspace = await pool.query(
            `SELECT id, active FROM workspaces WHERE slug = $1`,
            [req.params.slug]
        );

        if (workspace.rows.length === 0 || !workspace.rows[0].active) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const bookingId = Number(req.params.bookingId);
        const forms = await pool.query(
            `
      SELECT fr.id, fr.token, fr.status, ft.title, ft.description, ft.fields_json
      FROM form_responses fr
      JOIN form_templates ft ON fr.template_id = ft.id
      WHERE fr.workspace_id = $1 AND fr.booking_id = $2
      ORDER BY fr.id ASC
      `,
            [workspace.rows[0].id, bookingId]
        );

        res.json({
            forms: forms.rows.map((f) => ({
                id: f.id,
                token: f.token,
                status: f.status,
                title: f.title,
                description: f.description,
                fieldsJson: f.fields_json,
            })),
        });
    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


// Get form by token
const getFormToken = async (req, res) => {
    try {
        const form = await pool.query(
            `
      SELECT fr.token, fr.status, ft.title, ft.description, ft.fields_json, w.active
      FROM form_responses fr
      JOIN form_templates ft ON fr.template_id = ft.id
      JOIN workspaces w ON fr.workspace_id = w.id
      WHERE fr.token = $1
      `,
            [req.params.token]
        );

        if (form.rows.length === 0 || !form.rows[0].active) {
            return res.status(404).json({ error: "Form not found" });
        }

        const f = form.rows[0];
        res.json({
            form: {
                token: f.token,
                status: f.status,
                title: f.title,
                description: f.description,
                fieldsJson: f.fields_json,
            },
        });
    } catch (error) {
        console.error("Error fetching form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


// Submit form response 
const submitForm = async (req, res) => {
    try {
        const form = await pool.query(
            `SELECT id FROM form_responses WHERE token = $1`,
            [req.params.token]
        );

        if (form.rows.length === 0) {
            return res.status(404).json({ error: "Form not found" });
        }

        await pool.query(
            `
      UPDATE form_responses
      SET status = $1, submitted_at = NOW(), answers_json = $2, updated_at = NOW()
      WHERE token = $3
      `,
            ["COMPLETED", req.body ?? {}, req.params.token]
        );

        res.json({ ok: true });
    } catch (error) {
        console.error("Error submitting form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    getPublicWorkspaceInfo,
    submitContactForm,
    getAvailability,
    createBooking,
    getFormBooking,
    getFormToken,
    submitForm
};

