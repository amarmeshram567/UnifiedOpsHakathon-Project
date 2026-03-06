const express = require("express");
const { getDashboardOverview } = require("../controllers/dashboardController");
const { requireAuth } = require("../middlewares/auth");
const { requireActiveWorkspace, requireWorkspaceAccess } = require("../middlewares/workspace");

const dashboardRouter = express.Router();

// Auth + workspace access required for all dashboard routes
dashboardRouter.use(requireAuth());
dashboardRouter.use(requireWorkspaceAccess());
dashboardRouter.use(requireActiveWorkspace());

// ✅ GET DASHBOARD OVERVIEW
dashboardRouter.get("/", getDashboardOverview);

module.exports = dashboardRouter;
