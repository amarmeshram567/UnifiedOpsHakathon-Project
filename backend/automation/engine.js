const { pool } = require("../config/db");
const { pickDefaultChannel, sendViaChannel } = require("../integration/channels");
const { nanoid } = require("nanoid");

//  LOG EVENT
async function logEvent(workspaceId, event, payloadJson) {
    try {
        await pool.query(
            `
      INSERT INTO event_logs (workspace_id, event, payload_json, created_at)
      VALUES ($1, $2, $3, NOW())
      `,
            [workspaceId, event, JSON.stringify(payloadJson)]
        );
    } catch (error) {
        console.error("Error logging event:", error);
    }
}

//  CREATE ALERT
async function createAlert({ workspaceId, severity = "INFO", type, title, body, linkPath }) {
    try {
        await pool.query(
            `
      INSERT INTO alerts (workspace_id, severity, type, title, body, link_path, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
            [workspaceId, severity, type, title, body, linkPath]
        );
    } catch (error) {
        console.error("Error creating alert:", error);
    }
}

// ON NEW CONTACT (send welcome message)
async function onNewContact({ workspaceId, contactId, conversationId }) {
    try {
        // Get contact form settings and contact
        const [settingsResult, contactResult] = await Promise.all([
            pool.query(`SELECT welcome_text FROM contact_form_settings WHERE workspace_id = $1`, [workspaceId]),
            pool.query(`SELECT id, email, phone FROM contacts WHERE id = $1`, [contactId]),
        ]);

        if (contactResult.rows.length === 0) {
            return;
        }

        const contact = contactResult.rows[0];
        const welcomeText = settingsResult.rows[0]?.welcome_text || "Thanks for reaching out — we'll get back to you shortly.";

        // Pick default channel
        const channel = await pickDefaultChannel(workspaceId);
        if (!channel) {
            await createAlert({
                workspaceId,
                severity: "WARNING",
                type: "INTEGRATION_MISSING",
                title: "No communication channel connected",
                body: "Connect Email or SMS to send automated messages.",
                linkPath: "/settings/integrations",
            });
            return;
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Create message
            await client.query(
                `
        INSERT INTO messages (conversation_id, direction, channel_type, body, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        `,
                [conversationId, "OUTBOUND", channel.type, welcomeText]
            );

            // Update conversation
            await client.query(
                `UPDATE conversations SET last_outbound_at = NOW() WHERE id = $1`,
                [conversationId]
            );

            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

        // Send via channel (outside transaction)
        await sendViaChannel({
            workspaceId,
            channelType: channel.type,
            toEmail: contact.email || undefined,
            toPhone: contact.phone || undefined,
            body: welcomeText,
            context: "welcome_message",
        });

        // Log event
        await logEvent(workspaceId, "contact.created", { contactId });
    } catch (error) {
        console.error("Error in onNewContact:", error);
    }
}

//  ON BOOKING CREATED (send confirmation, create forms, consume inventory)
async function onBookingCreated({ workspaceId, bookingId }) {
    try {
        // Fetch booking with contact and booking type
        const bookingResult = await pool.query(
            `
      SELECT b.id, b.contact_id, b.booking_type_id, b.start_at, b.workspace_id,
             c.email as contact_email, c.phone as contact_phone,
             bt.name as booking_type_name
      FROM bookings b
      JOIN contacts c ON b.contact_id = c.id
      JOIN booking_types bt ON b.booking_type_id = bt.id
      WHERE b.id = $1 AND b.workspace_id = $2
      `,
            [bookingId, workspaceId]
        );

        if (bookingResult.rows.length === 0) {
            return;
        }

        const booking = bookingResult.rows[0];

        // Find conversation for this contact
        const convResult = await pool.query(
            `SELECT id, automation_paused FROM conversations WHERE workspace_id = $1 AND contact_id = $2`,
            [workspaceId, booking.contact_id]
        );

        // Pick default channel
        const channel = await pickDefaultChannel(workspaceId);

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Send booking confirmation if channel and conversation exist
            if (channel && convResult.rows.length > 0 && !convResult.rows[0].automation_paused) {
                const conversation = convResult.rows[0];
                const confirmBody = `Booking confirmed: ${booking.booking_type_name} at ${booking.start_at}`;

                await client.query(
                    `
          INSERT INTO messages (conversation_id, direction, channel_type, body, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          `,
                    [conversation.id, "OUTBOUND", channel.type, confirmBody]
                );

                await client.query(
                    `UPDATE conversations SET last_outbound_at = NOW() WHERE id = $1`,
                    [conversation.id]
                );

                // Send via channel
                await sendViaChannel({
                    workspaceId,
                    channelType: channel.type,
                    toEmail: booking.contact_email || undefined,
                    toPhone: booking.contact_phone || undefined,
                    body: confirmBody,
                    context: "booking_confirmation",
                });
            }

            // Create form responses for templates linked to booking type + generic
            const templatesResult = await client.query(
                `
        SELECT id FROM form_templates
        WHERE workspace_id = $1 AND (booking_type_id = $2 OR booking_type_id IS NULL)
        `,
                [workspaceId, booking.booking_type_id]
            );

            const dueAt = new Date(new Date(booking.start_at).getTime() - 6 * 60 * 60 * 1000);

            for (const template of templatesResult.rows) {
                const token = nanoid(24);
                await client.query(
                    `
          INSERT INTO form_responses (workspace_id, booking_id, template_id, token, due_at, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `,
                    [workspaceId, bookingId, template.id, token, dueAt, "PENDING"]
                );
            }

            // Consume inventory for this booking type
            const resourcesResult = await client.query(
                `
        SELECT r.id, r.inventory_item_id, r.quantity_per_booking, i.name, i.low_stock_at, i.on_hand
        FROM booking_type_resources r
        JOIN inventory_items i ON r.inventory_item_id = i.id
        WHERE r.workspace_id = $1 AND r.booking_type_id = $2
        `,
                [workspaceId, booking.booking_type_id]
            );

            for (const resource of resourcesResult.rows) {
                const newOnHand = Math.max(0, resource.on_hand - resource.quantity_per_booking);

                await client.query(
                    `UPDATE inventory_items SET on_hand = $1, updated_at = NOW() WHERE id = $2`,
                    [newOnHand, resource.inventory_item_id]
                );

                await client.query(
                    `
          INSERT INTO inventory_usage (workspace_id, inventory_item_id, booking_id, delta, reason, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          `,
                    [
                        workspaceId,
                        resource.inventory_item_id,
                        bookingId,
                        -resource.quantity_per_booking,
                        `Used for booking: ${booking.booking_type_name}`,
                    ]
                );

                if (newOnHand <= resource.low_stock_at) {
                    const severity = newOnHand === 0 ? "CRITICAL" : "WARNING";
                    await client.query(
                        `
            INSERT INTO alerts (workspace_id, severity, type, title, body, link_path, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `,
                        [
                            workspaceId,
                            severity,
                            "INVENTORY_LOW",
                            `Low stock: ${resource.name}`,
                            `On-hand: ${newOnHand}. Threshold: ${resource.low_stock_at}.`,
                            "/inventory",
                        ]
                    );
                }
            }

            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

        // Log event
        await logEvent(workspaceId, "booking.created", { bookingId });
    } catch (error) {
        console.error("Error in onBookingCreated:", error);
    }
}

//  RUN AUTOMATION TICK (handle overdue forms + missed messages)
async function runAutomationTick() {
    try {
        const now = new Date();

        // 1) Mark overdue forms and create alerts
        const overdueResult = await pool.query(
            `
      SELECT id, workspace_id FROM form_responses
      WHERE status = $1 AND due_at < $2
      LIMIT 200
      `,
            ["PENDING", now]
        );

        for (const fr of overdueResult.rows) {
            // Update form status
            await pool.query(`UPDATE form_responses SET status = $1 WHERE id = $2`, ["OVERDUE", fr.id]);

            // Check if alert already exists
            const linkPath = `/forms?formResponseId=${fr.id}`;
            const alertExists = await pool.query(
                `
        SELECT COUNT(*) as count FROM alerts
        WHERE workspace_id = $1 AND resolved_at IS NULL AND type = $2 AND link_path = $3
        `,
                [fr.workspace_id, "FORM_OVERDUE", linkPath]
            );

            if (parseInt(alertExists.rows[0].count) === 0) {
                await createAlert({
                    workspaceId: fr.workspace_id,
                    severity: "WARNING",
                    type: "FORM_OVERDUE",
                    title: "Overdue form",
                    body: "A customer form is overdue.",
                    linkPath,
                });
            }
        }

        // 2) Find unanswered conversations and create alerts
        const candidatesResult = await pool.query(
            `
      SELECT id, workspace_id, last_inbound_at, last_outbound_at
      FROM conversations
      WHERE automation_paused = false AND last_inbound_at IS NOT NULL
      ORDER BY last_inbound_at DESC
      LIMIT 200
      `
        );

        for (const c of candidatesResult.rows) {
            const hasOutbound = c.last_outbound_at && new Date(c.last_outbound_at) >= new Date(c.last_inbound_at);

            if (!hasOutbound) {
                const linkPath = `/inbox?conversationId=${c.id}`;
                const alertExists = await pool.query(
                    `
          SELECT COUNT(*) as count FROM alerts
          WHERE workspace_id = $1 AND resolved_at IS NULL AND type = $2 AND link_path = $3
          `,
                    [c.workspace_id, "MISSED_MESSAGE", linkPath]
                );

                if (parseInt(alertExists.rows[0].count) === 0) {
                    await createAlert({
                        workspaceId: c.workspace_id,
                        severity: "WARNING",
                        type: "MISSED_MESSAGE",
                        title: "Unanswered customer message",
                        body: "A conversation has a new inbound message without a reply.",
                        linkPath,
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error in runAutomationTick:", error);
    }
}

module.exports = {
    logEvent,
    createAlert,
    onNewContact,
    onBookingCreated,
    runAutomationTick,
};

