const { pool } = require("../config/db");

// PICK DEFAULT CHANNEL (first enabled channel for workspace)
async function pickDefaultChannel(workspaceId) {
    try {
        const result = await pool.query(
            `
      SELECT id, workspace_id, type, enabled, from_email, from_phone, created_at
      FROM integration_channels
      WHERE workspace_id = $1 AND enabled = true
      ORDER BY id ASC
      LIMIT 1
      `,
            [workspaceId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id,
            workspaceId: row.workspace_id,
            type: row.type,
            enabled: row.enabled,
            fromEmail: row.from_email,
            fromPhone: row.from_phone,
            createdAt: row.created_at,
        };
    } catch (error) {
        console.error("Error picking default channel:", error);
        return null;
    }
}

// SEND VIA CHANNEL (validate and log failures)
async function sendViaChannel({ workspaceId, channelType, toEmail, toPhone, body, context }) {
    try {
        // Find channel
        const channelResult = await pool.query(
            `
      SELECT id, enabled, type
      FROM integration_channels
      WHERE workspace_id = $1 AND type = $2
      `,
            [workspaceId, channelType]
        );

        const channel = channelResult.rows[0];

        // Validate channel exists and is enabled
        if (!channel || !channel.enabled) {
            throw new Error(`Channel ${channelType} not connected/enabled`);
        }

        // Validate required fields
        if (channelType === "EMAIL" && !toEmail) {
            throw new Error("Missing toEmail");
        }
        if (channelType === "SMS" && !toPhone) {
            throw new Error("Missing toPhone");
        }
        if (!body?.trim()) {
            throw new Error("Missing body");
        }

        return { ok: true };
    } catch (e) {
        // Log integration failure
        try {
            await pool.query(
                `
        INSERT INTO integration_failures (workspace_id, channel_type, context, error, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        `,
                [workspaceId, channelType, context || "send", String(e?.message || e)]
            );
        } catch (dbErr) {
            console.error("Failed to log integration failure:", dbErr);
        }

        return { ok: false, error: String(e?.message || e) };
    }
}

module.exports = {
    pickDefaultChannel,
    sendViaChannel,
};

