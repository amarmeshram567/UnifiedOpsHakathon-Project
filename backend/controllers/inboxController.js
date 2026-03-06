const { pool } = require("../config/db");
const { z } = require("zod");

// ✅ GET ALL CONVERSATIONS
const getConversations = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;

        const result = await pool.query(
            `
      SELECT 
        c.id,
        c.workspace_id,
        c.contact_id,
        c.last_inbound_at,
        c.last_outbound_at,
        c.automation_paused,
        c.created_at,
        ct.id as contact_id,
        ct.name as contact_name,
        ct.email as contact_email,
        ct.phone as contact_phone
      FROM conversations c
      LEFT JOIN contacts ct ON c.contact_id = ct.id
      WHERE c.workspace_id = $1
      ORDER BY c.id DESC
      LIMIT 100
      `,
            [workspaceId]
        );

        const conversations = result.rows.map((row) => ({
            id: row.id,
            workspaceId: row.workspace_id,
            contactId: row.contact_id,
            lastInboundAt: row.last_inbound_at,
            lastOutboundAt: row.last_outbound_at,
            automationPaused: row.automation_paused,
            createdAt: row.created_at,
            contact: row.contact_id ? {
                id: row.contact_id,
                name: row.contact_name,
                email: row.contact_email,
                phone: row.contact_phone,
            } : null,
        }));

        res.json({ conversations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ GET CONVERSATION WITH MESSAGES
const getConversationDetail = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;
        const id = Number(req.params.id);

        // Get conversation and contact
        const convoResult = await pool.query(
            `
      SELECT 
        c.id,
        c.workspace_id,
        c.contact_id,
        c.last_inbound_at,
        c.last_outbound_at,
        c.automation_paused,
        c.created_at,
        ct.id as contact_id,
        ct.name as contact_name,
        ct.email as contact_email,
        ct.phone as contact_phone
      FROM conversations c
      LEFT JOIN contacts ct ON c.contact_id = ct.id
      WHERE c.id = $1 AND c.workspace_id = $2
      `,
            [id, workspaceId]
        );

        if (convoResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const convoRow = convoResult.rows[0];

        // Get messages ordered by creation time
        const messagesResult = await pool.query(
            `
      SELECT id, conversation_id, direction, channel_type, body, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
            [id]
        );

        const conversation = {
            id: convoRow.id,
            workspaceId: convoRow.workspace_id,
            contactId: convoRow.contact_id,
            lastInboundAt: convoRow.last_inbound_at,
            lastOutboundAt: convoRow.last_outbound_at,
            automationPaused: convoRow.automation_paused,
            createdAt: convoRow.created_at,
            contact: convoRow.contact_id ? {
                id: convoRow.contact_id,
                name: convoRow.contact_name,
                email: convoRow.contact_email,
                phone: convoRow.contact_phone,
            } : null,
            messages: messagesResult.rows.map((msg) => ({
                id: msg.id,
                conversationId: msg.conversation_id,
                direction: msg.direction,
                channelType: msg.channel_type,
                body: msg.body,
                createdAt: msg.created_at,
            })),
        };

        res.json({ conversation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ POST REPLY TO CONVERSATION
const replyToConversation = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;
        const id = Number(req.params.id);

        const schema = z.object({
            channelType: z.enum(["EMAIL", "SMS"]),
            body: z.string().min(1),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        // Verify conversation exists
        const convoResult = await pool.query(
            `SELECT id, workspace_id FROM conversations WHERE id = $1 AND workspace_id = $2`,
            [id, workspaceId]
        );

        if (convoResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Pause automation and update last outbound
            await client.query(
                `
        UPDATE conversations
        SET automation_paused = true, last_outbound_at = NOW()
        WHERE id = $1
        `,
                [id]
            );

            // Create outbound message
            const msgResult = await client.query(
                `
        INSERT INTO messages (conversation_id, direction, channel_type, body, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, conversation_id, direction, channel_type, body, created_at
        `,
                [id, "OUTBOUND", parsed.data.channelType, parsed.data.body]
            );

            await client.query("COMMIT");

            const message = msgResult.rows[0];

            res.json({
                ok: true,
                message: {
                    id: message.id,
                    conversationId: message.conversation_id,
                    direction: message.direction,
                    channelType: message.channel_type,
                    body: message.body,
                    createdAt: message.created_at,
                },
            });
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

// ✅ POST INBOUND MESSAGE (MVP: simulate for demos)
const addInboundMessage = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;
        const id = Number(req.params.id);

        const schema = z.object({
            channelType: z.enum(["EMAIL", "SMS"]),
            body: z.string().min(1),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        // Verify conversation exists
        const convoResult = await pool.query(
            `SELECT id, workspace_id FROM conversations WHERE id = $1 AND workspace_id = $2`,
            [id, workspaceId]
        );

        if (convoResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Create inbound message
            const msgResult = await client.query(
                `
        INSERT INTO messages (conversation_id, direction, channel_type, body, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, conversation_id, direction, channel_type, body, created_at
        `,
                [id, "INBOUND", parsed.data.channelType, parsed.data.body]
            );

            // Update conversation last inbound time
            await client.query(
                `
        UPDATE conversations
        SET last_inbound_at = NOW()
        WHERE id = $1
        `,
                [id]
            );

            await client.query("COMMIT");

            const message = msgResult.rows[0];

            res.json({
                ok: true,
                message: {
                    id: message.id,
                    conversationId: message.conversation_id,
                    direction: message.direction,
                    channelType: message.channel_type,
                    body: message.body,
                    createdAt: message.created_at,
                },
            });
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

module.exports = {
    getConversations,
    getConversationDetail,
    replyToConversation,
    addInboundMessage,
};
