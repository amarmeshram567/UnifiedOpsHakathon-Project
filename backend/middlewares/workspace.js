const { pool } = require("../config/db");


// ✅ Require Workspace Access
// function requireWorkspaceAccess(options = {}) {
//     const { role } = options;

//     return async (req, res, next) => {
//         try {
//             const workspaceId = Number(
//                 req.headers["x-workspace-id"] || req.params.workspaceId
//             );

//             if (!workspaceId || Number.isNaN(workspaceId)) {
//                 return res.status(400).json({
//                     error: "Missing x-workspace-id header"
//                 });
//             }

//             // 🔥 Check membership + get workspace
//             const result = await pool.query(
//                 `
//         SELECT 
//           m.role,
//           w.*
//         FROM memberships m
//         JOIN workspaces w ON m.workspace_id = w.id
//         WHERE m.user_id = $1 AND m.workspace_id = $2
//         `,
//                 [req.user.id, workspaceId]
//             );

//             if (result.rows.length === 0) {
//                 return res.status(403).json({
//                     error: "No access to workspace"
//                 });
//             }

//             const membership = result.rows[0];

//             // 🔥 Role Check
//             if (role && membership.role !== role) {
//                 return res.status(403).json({
//                     error: "Insufficient role"
//                 });
//             }

//             // Attach workspace to request
//             req.workspace = {
//                 id: membership.id,
//                 slug: membership.slug,
//                 name: membership.name,
//                 active: membership.active,
//                 time_zone: membership.time_zone,
//                 contact_email: membership.contact_email
//             };

//             req.membership = {
//                 role: membership.role
//             };

//             next();

//         } catch (err) {
//             console.error(err);
//             return res.status(500).json({ error: "Server error" });
//         }
//     };
// }

// const requireWorkspaceAccess = (options = {}) => {
//     const { role } = options;
//     return async (req, res, next) => {

//         try {
//             const workspaceId = Number(req.headers["x-workspace-id"] || req.params.workspaceId);
//             if (!workspaceId || Number.isNaN(workspaceId)) {
//                 return res.status(400).json({ error: "Invalid workspaceId" });
//             }

//             //     const result = await pool.query(
//             //         `
//             // SELECT 
//             //     m.id as membership_id,
//             //     m.role,
//             //     w.id as workspace_id,
//             //     w.slug,
//             //     w.name,
//             //     w.is_active,
//             //     w.time_zone,
//             //     w.contact_email
//             // `,
//             //         [req.user.id, workspaceId]
//             //     );


//             const result = await pool.query(
//                 `
//                 SELECT 
//                     m.id as membership_id,
//                     m.role,
//                     w.id as workspace_id,
//                     w.slug,
//                     w.name,
//                     w.is_active,
//                     w.time_zone,
//                     w.contact_email
//                 FROM memberships m
//                 JOIN workspaces w ON m.workspace_id = w.id
//                 WHERE m.user_id = $1 AND m.workspace_id = $2
//                 `,
//                 [req.user.id, workspaceId]
//             );

//             console.log("Workspace middleware hit", req.workspace);

//             if (result.rows.length === 0) {
//                 return res.status(403).json({ error: "No access to workspace" });
//             }

//             const membership = result.rows[0];

//             // Role check
//             if (role && membership.role !== role) {
//                 return res.status(403).json({ error: "Insufficient role" });
//             }

//             // Attach workspace & membership
//             // req.workspace = {
//             //     id: membership.id, // or membership.workspace_id
//             //     slug: membership.slug,
//             //     name: membership.name,
//             //     active: membership.active,
//             //     time_zone: membership.time_zone,
//             //     contact_email: membership.contact_email
//             // };

//             req.workspace = {
//                 id: membership.workspace_id,
//                 slug: membership.slug,
//                 name: membership.name,
//                 active: membership.is_active,
//                 time_zone: membership.time_zone,
//                 contact_email: membership.contact_email
//             };

//             req.membership = { role: membership.role };
//             console.log("Middleware passed:", req.workspace, req.membership);
//             next();
//         } catch (err) {
//             console.error("requireWorkspaceAccess error:", err);
//             res.status(500).json({ error: "Server error" });
//         }
//     };
// };

const requireWorkspaceAccess = (options = {}) => {
    const { role } = options;

    return async (req, res, next) => {
        try {
            const workspaceId = Number(
                req.headers["x-workspace-id"] || req.params.workspaceId
            );

            const workspaceId1 = Number(req.params.workspaceId);

            console.log("Workspace ID from header:", workspaceId);

            console.log("Activating workspace:", workspaceId1);


            if (!workspaceId || Number.isNaN(workspaceId)) {
                return res.status(400).json({ error: "Invalid workspaceId" });
            }

            const result = await pool.query(
                `
        SELECT 
          m.id as membership_id,
          m.role,
          w.id as workspace_id,
          w.slug,
          w.name,
          w.active,
          w.time_zone,
          w.contact_email
        FROM memberships m
        JOIN workspaces w ON m.workspace_id = w.id
        WHERE m.user_id = $1 AND m.workspace_id = $2
        `,
                [req.user.id, workspaceId]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({ error: "No access to workspace" });
            }

            const membership = result.rows[0];

            if (role && membership.role !== role) {
                return res.status(403).json({ error: "Insufficient role" });
            }

            req.workspace = {
                id: membership.workspace_id,
                slug: membership.slug,
                name: membership.name,
                active: membership.active,
                time_zone: membership.time_zone,
                contact_email: membership.contact_email
            };

            req.membership = { role: membership.role };

            next();
        } catch (err) {
            console.error("requireWorkspaceAccess error:", err);
            res.status(500).json({ error: "Server error" });
        }
    };
};

// ✅ Require Active Workspace
// function requireActiveWorkspace() {
//     return (req, res, next) => {
//         if (!req.workspace || !req.workspace.active) {
//             return res.status(403).json({
//                 error: "Workspace not active. Complete onboarding to activate."
//             });
//         }
//         next();
//     };
// }

const requireActiveWorkspace = () => {
    return (req, res, next) => {
        console.log("Checking active workspace:", req.workspace);
        if (!req.workspace || !req.workspace.active) {
            return res.status(403).json({
                error: "Workspace not active. Complete onboarding to activate."
            });
        }
        next();
    };
};


// ✅ Export (CommonJS)
module.exports = {
    requireWorkspaceAccess,
    requireActiveWorkspace
};


/*
 SELECT 
          m.id as membership_id,
          m.role,
          w.*
        FROM memberships m
        JOIN workspaces w ON m.workspace_id = w.id
        WHERE m.user_id = $1 AND m.workspace_id = $2

*/