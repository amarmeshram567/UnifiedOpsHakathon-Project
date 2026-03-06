const { pool } = require("../config/db");

// ✅ GET DASHBOARD OVERVIEW
const getDashboardOverview = async (req, res) => {
    try {
        const workspaceId = req.workspace.id;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

        // Fetch all metrics in parallel
        const [
            todaysBookingsResult,
            upcomingBookingsResult,
            completedCountResult,
            noShowCountResult,
            newInquiriesResult,
            pendingFormsResult,
            overdueFormsResult,
            lowStockResult,
            alertsResult,
            convoCandidatesResult,
            completedFormsResult,
        ] = await Promise.all([
            // Today's bookings
            pool.query(
                `SELECT COUNT(*) as count FROM bookings WHERE workspace_id = $1 AND start_at >= $2 AND start_at < $3`,
                [workspaceId, startOfToday, endOfToday]
            ),
            // Upcoming bookings
            pool.query(
                `SELECT COUNT(*) as count FROM bookings WHERE workspace_id = $1 AND start_at >= $2`,
                [workspaceId, endOfToday]
            ),
            // Completed bookings
            pool.query(
                `SELECT COUNT(*) as count FROM bookings WHERE workspace_id = $1 AND status = $2`,
                [workspaceId, "COMPLETED"]
            ),
            // No-show bookings
            pool.query(
                `SELECT COUNT(*) as count FROM bookings WHERE workspace_id = $1 AND status = $2`,
                [workspaceId, "NO_SHOW"]
            ),
            // New inquiries (conversations)
            pool.query(
                `SELECT COUNT(*) as count FROM conversations WHERE workspace_id = $1`,
                [workspaceId]
            ),
            // Pending forms
            pool.query(
                `SELECT COUNT(*) as count FROM form_responses WHERE workspace_id = $1 AND status = $2`,
                [workspaceId, "PENDING"]
            ),
            // Overdue forms
            pool.query(
                `SELECT COUNT(*) as count FROM form_responses WHERE workspace_id = $1 AND status = $2`,
                [workspaceId, "OVERDUE"]
            ),
            // Low stock items (top 10)
            pool.query(
                `SELECT id, name, on_hand, low_stock_at FROM inventory_items 
         WHERE workspace_id = $1 
         ORDER BY on_hand ASC 
         LIMIT 10`,
                [workspaceId]
            ),
            // Unresolved alerts (top 20)
            pool.query(
                `SELECT id, severity, type, title, body, link_path, created_at FROM alerts 
         WHERE workspace_id = $1 AND resolved_at IS NULL 
         ORDER BY created_at DESC 
         LIMIT 20`,
                [workspaceId]
            ),
            // Conversation candidates for unanswered count
            pool.query(
                `SELECT id, last_inbound_at, last_outbound_at FROM conversations 
         WHERE workspace_id = $1 AND last_inbound_at IS NOT NULL 
         ORDER BY last_inbound_at DESC 
         LIMIT 500`,
                [workspaceId]
            ),
            // Completed forms
            pool.query(
                `SELECT COUNT(*) as count FROM form_responses WHERE workspace_id = $1 AND status = $2`,
                [workspaceId, "COMPLETED"]
            ),
        ]);

        const todaysBookings = parseInt(todaysBookingsResult.rows[0].count);
        const upcomingBookings = parseInt(upcomingBookingsResult.rows[0].count);
        const completedCount = parseInt(completedCountResult.rows[0].count);
        const noShowCount = parseInt(noShowCountResult.rows[0].count);
        const newInquiries = parseInt(newInquiriesResult.rows[0].count);
        const pendingForms = parseInt(pendingFormsResult.rows[0].count);
        const overdueForms = parseInt(overdueFormsResult.rows[0].count);
        const lowStock = lowStockResult.rows;
        const alerts = alertsResult.rows;
        const convoCandidates = convoCandidatesResult.rows;
        const completedForms = parseInt(completedFormsResult.rows[0].count);

        // Calculate unanswered conversations
        const unanswered = convoCandidates.filter(
            (c) => c.last_inbound_at && (!c.last_outbound_at || new Date(c.last_outbound_at) < new Date(c.last_inbound_at))
        ).length;

        // Filter low stock items
        const lowStockItems = lowStock.filter((i) => i.on_hand <= i.low_stock_at);

        res.json({
            bookingOverview: {
                todaysBookings,
                upcomingBookings,
                completedCount,
                noShowCount,
            },
            leadsAndConversations: {
                conversations: newInquiries,
                unanswered,
            },
            formsStatus: {
                pendingForms,
                overdueForms,
                completedForms,
            },
            inventoryAlerts: lowStockItems.map((i) => ({
                id: i.id,
                name: i.name,
                onHand: i.on_hand,
                lowStockAt: i.low_stock_at,
            })),
            alerts: alerts.map((a) => ({
                id: a.id,
                severity: a.severity,
                type: a.type,
                title: a.title,
                body: a.body,
                linkPath: a.link_path,
                createdAt: a.created_at,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getDashboardOverview,
};


