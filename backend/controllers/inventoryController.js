const { pool } = require("../config/db");
const { z } = require("zod");

// ✅ GET ALL INVENTORY ITEMS
const getInventoryItems = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;

        const result = await pool.query(
            `
      SELECT id, workspace_id, name, unit, on_hand, low_stock_at, created_at, updated_at
      FROM inventory_items
      WHERE workspace_id = $1
      ORDER BY name ASC
      `,
            [workspaceId]
        );

        const items = result.rows.map((row) => ({
            id: row.id,
            workspaceId: row.workspace_id,
            name: row.name,
            unit: row.unit,
            onHand: row.on_hand,
            lowStockAt: row.low_stock_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));

        res.json({ items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ UPDATE INVENTORY ITEM
const updateInventoryItem = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;
        const id = Number(req.params.id);

        const schema = z.object({
            onHand: z.number().int().min(0).optional(),
            lowStockAt: z.number().int().min(0).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        // Verify item exists
        const itemResult = await pool.query(
            `SELECT * FROM inventory_items WHERE id = $1 AND workspace_id = $2`,
            [id, workspaceId]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        // Build update query dynamically
        let updateQuery = `UPDATE inventory_items SET updated_at = NOW()`;
        const updateParams = [];
        let paramIndex = 1;

        if (parsed.data.onHand !== undefined) {
            updateQuery += `, on_hand = $${paramIndex}`;
            updateParams.push(parsed.data.onHand);
            paramIndex++;
        }

        if (parsed.data.lowStockAt !== undefined) {
            updateQuery += `, low_stock_at = $${paramIndex}`;
            updateParams.push(parsed.data.lowStockAt);
            paramIndex++;
        }

        updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
        updateParams.push(id);

        const updated = await pool.query(updateQuery, updateParams);

        const item = updated.rows[0];
        res.json({
            item: {
                id: item.id,
                workspaceId: item.workspace_id,
                name: item.name,
                unit: item.unit,
                onHand: item.on_hand,
                lowStockAt: item.low_stock_at,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ ADJUST INVENTORY (with usage tracking and alerts)
const adjustInventory = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;
        const id = Number(req.params.id);

        const schema = z.object({
            delta: z.number().int(),
            reason: z.string().min(1),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        // Verify item exists
        const itemResult = await pool.query(
            `SELECT id, name, on_hand, low_stock_at FROM inventory_items WHERE id = $1 AND workspace_id = $2`,
            [id, workspaceId]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const item = itemResult.rows[0];
        const newOnHand = Math.max(0, item.on_hand + parsed.data.delta);

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Update inventory item
            await client.query(
                `
        UPDATE inventory_items
        SET on_hand = $1, updated_at = NOW()
        WHERE id = $2
        `,
                [newOnHand, id]
            );

            // Create inventory usage record
            await client.query(
                `
        INSERT INTO inventory_usage (workspace_id, inventory_item_id, delta, reason, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        `,
                [workspaceId, id, parsed.data.delta, parsed.data.reason]
            );

            // Create alert if low stock
            if (newOnHand <= item.low_stock_at) {
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
                        `Low stock: ${item.name}`,
                        `On-hand: ${newOnHand}. Threshold: ${item.low_stock_at}.`,
                        "/inventory",
                    ]
                );
            }

            await client.query("COMMIT");

            res.json({ ok: true, onHand: newOnHand });
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
    getInventoryItems,
    updateInventoryItem,
    adjustInventory,
};
