const express = require("express");
const { getFormResponses, remindFormResponse } = require("../controllers/formController");
const { requireAuth } = require("../middlewares/auth");
const { requireActiveWorkspace, requireWorkspaceAccess } = require("../middlewares/workspace");

const formRouter = express.Router();

// Auth + workspace access required for all form routes
formRouter.use(requireAuth());
formRouter.use(requireWorkspaceAccess());
formRouter.use(requireActiveWorkspace());

// ✅ GET ALL FORM RESPONSES
formRouter.get("/", getFormResponses);

// ✅ SEND FORM REMINDER
formRouter.post("/:id/remind", remindFormResponse);

module.exports = formRouter;
