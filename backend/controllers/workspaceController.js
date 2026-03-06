const { pool } = require("../config/db");
const { z } = require("zod");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");

// ✅ GET ALL WORKSPACES (by user)
const getWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log(userId)

        const result = await pool.query(
            `
      SELECT 
        w.id,
        w.slug,
        w.name,
        w.time_zone,
        w.contact_email,
        w.onboarding_step,
        w.active,
        m.role
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1
      ORDER BY w.id ASC
      `,
            [userId]
        );

        res.json({
            workspaces: result.rows.map((row) => ({
                id: row.id,
                slug: row.slug,
                name: row.name,
                timeZone: row.time_zone,
                contactEmail: row.contact_email,
                onboardingStep: row.onboarding_step,
                active: row.active,
                role: row.role,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ CREATE WORKSPACE
const createWorkspace = async (req, res) => {
    try {

        // console.log("Reached createWorkspace");
        // console.log("REQ USER:", req.user);


        const schema = z.object({
            name: z.string().min(1),
            address: z.string().optional(),
            timeZone: z.string().min(1),
            contactEmail: z.string().email(),
            slug: z.string().min(3).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const slug =
            parsed.data.slug?.toLowerCase().replace(/[^a-z0-9-]/g, "-") ||
            `w-${nanoid(8).toLowerCase()}`;

        const userId = req.user.id;

        // console.log("user ids: ".req.user?.id);


        // Create workspace and membership in transaction
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const workspaceResult = await client.query(
                `
        INSERT INTO workspaces (slug, name, address, time_zone, contact_email, onboarding_step, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
                [slug, parsed.data.name, parsed.data.address || null, parsed.data.timeZone, parsed.data.contactEmail, 2, false]
            );

            const workspace = workspaceResult.rows[0];

            // Add owner membership
            await client.query(
                `
        INSERT INTO memberships (user_id, workspace_id, role)
        VALUES ($1, $2, $3)
        `,
                [userId, workspace.id, "OWNER"]
            );

            // Create contact form settings
            await client.query(
                `
        INSERT INTO contact_form_settings (workspace_id, enabled)
        VALUES ($1, $2)
        `,
                [workspace.id, false]
            );

            await client.query("COMMIT");

            res.json({ workspace });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ GET WORKSPACE BY ID
const getWorkspaceById = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        const result = await pool.query(
            `
      SELECT 
        w.*,
        m.role
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: "No access" });
        }

        const workspace = result.rows[0];
        res.json({
            workspace: {
                id: workspace.id,
                slug: workspace.slug,
                name: workspace.name,
                timeZone: workspace.time_zone,
                contactEmail: workspace.contact_email,
            },
            role: workspace.role,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ GET WORKSPACE SETUP (all onboarding data)
const getWorkspaceSetup = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check membership
        const membershipResult = await pool.query(
            `
      SELECT w.*, m.role
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ error: "No access" });
        }

        const workspace = membershipResult.rows[0];
        const role = membershipResult.rows[0].role;

        // Fetch all setup data
        const [channels, contactForm, bookingTypes, availability, templates, staff] = await Promise.all([
            pool.query(`SELECT * FROM integration_channels WHERE workspace_id = $1 ORDER BY id ASC`, [workspaceId]),
            pool.query(`SELECT * FROM contact_form_settings WHERE workspace_id = $1`, [workspaceId]),
            pool.query(`SELECT * FROM booking_types WHERE workspace_id = $1 ORDER BY id ASC`, [workspaceId]),
            pool.query(
                `SELECT * FROM availabilities WHERE workspace_id = $1 ORDER BY day_of_week ASC, start_time ASC`,
                [workspaceId]
            ),
            pool.query(`SELECT * FROM form_templates WHERE workspace_id = $1 ORDER BY id ASC`, [workspaceId]),
            pool.query(
                `
        SELECT m.role, u.id, u.name, u.email
        FROM memberships m
        JOIN users u ON m.user_id = u.id
        WHERE m.workspace_id = $1
        ORDER BY m.id ASC
        `,
                [workspaceId]
            ),
        ]);

        res.json({
            workspace: {
                id: workspace.id,
                slug: workspace.slug,
                name: workspace.name,
                timeZone: workspace.time_zone,
                contactEmail: workspace.contact_email,
                active: workspace.active,
            },
            role,
            setup: {
                channels: channels.rows,
                contactForm: contactForm.rows[0] || null,
                bookingTypes: bookingTypes.rows,
                availability: availability.rows,
                templates: templates.rows,
                staff: staff.rows.map((m) => ({
                    role: m.role,
                    user: { id: m.id, name: m.name, email: m.email },
                })),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ONBOARDING: CHANNELS
const onboardingChannels = async (req, res) => {
    try {

        console.log("User in controller:", req.user);
        console.log("Body in controller:", req.body);

        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role, w.*
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        const schema = z.object({
            email: z.object({ enabled: z.boolean(), fromEmail: z.string().email().optional() }).optional(),
            sms: z.object({ enabled: z.boolean(), fromPhone: z.string().min(5).optional() }).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            if (parsed.data.email) {
                await client.query(
                    `
          INSERT INTO integration_channels (workspace_id, type, enabled, from_email)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (workspace_id, type) DO UPDATE
          SET enabled = $3, from_email = $4
          `,
                    [workspaceId, "EMAIL", parsed.data.email.enabled, parsed.data.email.fromEmail || null]
                );
            }

            if (parsed.data.sms) {
                await client.query(
                    `
          INSERT INTO integration_channels (workspace_id, type, enabled, from_phone)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (workspace_id, type) DO UPDATE
          SET enabled = $3, from_phone = $4
          `,
                    [workspaceId, "SMS", parsed.data.sms.enabled, parsed.data.sms.fromPhone || null]
                );
            }

            // Check enabled channels and update onboarding step
            const enabledResult = await client.query(
                `SELECT COUNT(*) as count FROM integration_channels WHERE workspace_id = $1 AND enabled = true`,
                [workspaceId]
            );
            const enabledCount = parseInt(enabledResult.rows[0].count);
            const nextStep = enabledCount > 0 ? 3 : 2;

            await client.query(
                `
        UPDATE workspaces
        SET onboarding_step = GREATEST(onboarding_step, $1)
        WHERE id = $2
        `,
                [nextStep, workspaceId]
            );

            await client.query("COMMIT");

            res.json({ ok: true, enabledCount });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ONBOARDING: CONTACT FORM
const onboardingContactForm = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role, w.*
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        const schema = z.object({
            enabled: z.boolean(),
            welcomeText: z.string().min(1).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            await client.query(
                `
        INSERT INTO contact_form_settings (workspace_id, enabled, welcome_text)
        VALUES ($1, $2, $3)
        ON CONFLICT (workspace_id) DO UPDATE
        SET enabled = $2, welcome_text = $3
        `,
                [workspaceId, parsed.data.enabled, parsed.data.welcomeText || null]
            );

            await client.query(
                `
        UPDATE workspaces
        SET onboarding_step = GREATEST(onboarding_step, $1)
        WHERE id = $2
        `,
                [4, workspaceId]
            );

            await client.query("COMMIT");

            res.json({ ok: true });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ONBOARDING: BOOKING SETUP
const onboardingBookingSetup = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role, w.*
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        const schema = z.object({
            bookingTypes: z
                .array(
                    z.object({
                        name: z.string().min(1),
                        durationMin: z.number().int().min(5).max(480),
                        location: z.string().optional(),
                    })
                )
                .min(1),
            availability: z
                .array(
                    z.object({
                        dayOfWeek: z.number().int().min(0).max(6),
                        startTime: z.string().regex(/^\d{2}:\d{2}$/),
                        endTime: z.string().regex(/^\d{2}:\d{2}$/),
                    })
                )
                .min(1),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Delete and recreate booking types
            await client.query(`DELETE FROM booking_types WHERE workspace_id = $1`, [workspaceId]);

            for (const bt of parsed.data.bookingTypes) {
                await client.query(
                    `
          INSERT INTO booking_types (workspace_id, name, duration_min, location)
          VALUES ($1, $2, $3, $4)
          `,
                    [workspaceId, bt.name, bt.durationMin, bt.location || null]
                );
            }

            // Delete and recreate availability
            await client.query(`DELETE FROM availabilities WHERE workspace_id = $1`, [workspaceId]);

            for (const av of parsed.data.availability) {
                await client.query(
                    `
          INSERT INTO availabilities (workspace_id, day_of_week, start_time, end_time)
          VALUES ($1, $2, $3, $4)
          `,
                    [workspaceId, av.dayOfWeek, av.startTime, av.endTime]
                );
            }

            // Update onboarding step
            await client.query(
                `
        UPDATE workspaces
        SET onboarding_step = GREATEST(onboarding_step, $1)
        WHERE id = $2
        `,
                [5, workspaceId]
            );

            await client.query("COMMIT");

            res.json({ ok: true });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ONBOARDING: FORMS
const onboardingForms = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role, w.*
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        const schema = z.object({
            templates: z.array(
                z.object({
                    title: z.string().min(1),
                    description: z.string().optional(),
                    bookingTypeId: z.number().int().optional().nullable(),
                    fieldsJson: z.any(),
                })
            ),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Delete existing templates
            await client.query(`DELETE FROM form_templates WHERE workspace_id = $1`, [workspaceId]);

            // Create new templates
            for (const t of parsed.data.templates) {
                await client.query(
                    `
          INSERT INTO form_templates (workspace_id, title, description, booking_type_id, fields_json)
          VALUES ($1, $2, $3, $4, $5)
          `,
                    [
                        workspaceId,
                        t.title,
                        t.description || null,
                        t.bookingTypeId ?? null,
                        JSON.stringify(t.fieldsJson ?? { fields: [] }),
                    ]
                );
            }

            // Update onboarding step
            await client.query(
                `
        UPDATE workspaces
        SET onboarding_step = GREATEST(onboarding_step, $1)
        WHERE id = $2
        `,
                [6, workspaceId]
            );

            await client.query("COMMIT");

            res.json({ ok: true });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ONBOARDING: INVENTORY
const onboardingInventory = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role, w.*
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        const schema = z.object({
            items: z.array(
                z.object({
                    name: z.string().min(1),
                    unit: z.string().optional(),
                    onHand: z.number().int().min(0),
                    lowStockAt: z.number().int().min(0),
                })
            ),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Delete existing items
            await client.query(`DELETE FROM inventory_items WHERE workspace_id = $1`, [workspaceId]);

            // Create new items
            for (const i of parsed.data.items) {
                await client.query(
                    `
          INSERT INTO inventory_items (workspace_id, name, unit, on_hand, low_stock_at)
          VALUES ($1, $2, $3, $4, $5)
          `,
                    [workspaceId, i.name, i.unit || null, i.onHand, i.lowStockAt]
                );
            }

            // Update onboarding step
            await client.query(
                `
        UPDATE workspaces
        SET onboarding_step = GREATEST(onboarding_step, $1)
        WHERE id = $2
        `,
                [7, workspaceId]
            );

            await client.query("COMMIT");

            res.json({ ok: true });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ONBOARDING: STAFF
const onboardingStaff = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role
      FROM memberships m
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        const schema = z.object({
            staff: z.array(z.object({ userId: z.number().int(), role: z.literal("STAFF") })).default([]),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Upsert staff memberships
            for (const s of parsed.data.staff) {
                await client.query(
                    `
          INSERT INTO memberships (user_id, workspace_id, role)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, workspace_id) DO UPDATE
          SET role = $3
          `,
                    [s.userId, workspaceId, "STAFF"]
                );
            }

            // Update onboarding step
            await client.query(
                `
        UPDATE workspaces
        SET onboarding_step = $1
        WHERE id = $2
        `,
                [8, workspaceId]
            );

            await client.query("COMMIT");

            res.json({ ok: true });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ CREATE STAFF (MVP helper)
const createStaff = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role
      FROM memberships m
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        const schema = z.object({
            name: z.string().min(1),
            email: z.string().email(),
            password: z.string().min(6),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        // Check if user exists
        const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [parsed.data.email]);

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "Email already in use" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Hash password
            const passwordHash = await bcrypt.hash(parsed.data.password, 10);

            // Create user
            const userResult = await client.query(
                `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email
        `,
                [parsed.data.name, parsed.data.email, passwordHash]
            );

            const staffUser = userResult.rows[0];

            // Create staff membership
            await client.query(
                `
        INSERT INTO memberships (user_id, workspace_id, role)
        VALUES ($1, $2, $3)
        `,
                [staffUser.id, workspaceId, "STAFF"]
            );

            await client.query("COMMIT");

            res.json({ ok: true, user: { id: staffUser.id, name: staffUser.name, email: staffUser.email } });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ACTIVATE WORKSPACE
const activateWorkspace = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check ownership
        const membershipResult = await pool.query(
            `
      SELECT m.role, w.*
      FROM workspaces w
      JOIN memberships m ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.workspace_id = $2
      `,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0 || membershipResult.rows[0].role !== "OWNER") {
            return res.status(403).json({ error: "Owner required" });
        }

        // Validate preconditions
        const enabledChannels = await pool.query(
            `SELECT COUNT(*) as count FROM integration_channels WHERE workspace_id = $1 AND enabled = true`,
            [workspaceId]
        );
        const bookingTypes = await pool.query(
            `SELECT COUNT(*) as count FROM booking_types WHERE workspace_id = $1`,
            [workspaceId]
        );
        const availability = await pool.query(
            `SELECT COUNT(*) as count FROM availabilities WHERE workspace_id = $1`,
            [workspaceId]
        );

        const enabledCount = parseInt(enabledChannels.rows[0].count);
        const typeCount = parseInt(bookingTypes.rows[0].count);
        const availCount = parseInt(availability.rows[0].count);

        if (enabledCount < 1) {
            return res.status(400).json({ error: "Connect Email or SMS first" });
        }
        if (typeCount < 1) {
            return res.status(400).json({ error: "Create at least one booking type" });
        }
        if (availCount < 1) {
            return res.status(400).json({ error: "Define availability" });
        }

        // Activate workspace
        const updated = await pool.query(
            `
      UPDATE workspaces
      SET active = true, onboarding_step = 8
      WHERE id = $1
      RETURNING *
      `,
            [workspaceId]
        );

        res.json({ workspace: updated.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ GET STAFF (all members of workspace)
const getStaff = async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const userId = req.user.id;

        // Check membership (any role can view staff)
        const membershipResult = await pool.query(
            `SELECT m.role FROM memberships m
             WHERE m.user_id = $1 AND m.workspace_id = $2`,
            [userId, workspaceId]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ error: "No access" });
        }

        const result = await pool.query(
            `SELECT
                m.id AS membership_id,
                m.role,
                u.id AS user_id,
                u.name,
                u.email,
                m.created_at
             FROM memberships m
             JOIN users u ON m.user_id = u.id
             WHERE m.workspace_id = $1
             ORDER BY m.id ASC`,
            [workspaceId]
        );

        const staff = result.rows.map((row) => ({
            membershipId: row.membership_id,
            role: row.role,
            createdAt: row.created_at,
            user: {
                id: row.user_id,
                name: row.name,
                email: row.email,
            },
        }));

        res.json({ staff });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};


const removeStaff = async (req, res) => {
    const workspaceId = Number(req.params.workspaceId);
    const membershipId = Number(req.params.membershipId);
    // verify caller is OWNER, then:
    await pool.query(
        `DELETE FROM memberships WHERE id = $1 AND workspace_id = $2 AND role != 'OWNER'`,
        [membershipId, workspaceId]
    );
    res.json({ ok: true });
};

module.exports = {
    getWorkspaces,
    createWorkspace,
    getWorkspaceById,
    getWorkspaceSetup,
    onboardingChannels,
    onboardingContactForm,
    onboardingBookingSetup,
    onboardingForms,
    onboardingInventory,
    onboardingStaff,
    createStaff,
    activateWorkspace,
    getStaff,
    removeStaff
};


