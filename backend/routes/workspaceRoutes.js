const express = require("express");
const {
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
    removeStaff,
    getStaff,
} = require("../controllers/workspaceController");
const { requireAuth } = require("../middlewares/auth");
const { requireActiveWorkspace, requireWorkspaceAccess } = require("../middlewares/workspace");

const workspaceRouter = express.Router();

// Auth middleware applied to all routes
workspaceRouter.use(requireAuth());

// ✅ GET ALL WORKSPACES (for user)
workspaceRouter.get("/", getWorkspaces);

// ✅ CREATE NEW WORKSPACE
workspaceRouter.post("/", createWorkspace);

// ✅ GET SPECIFIC WORKSPACE
workspaceRouter.get("/:workspaceId", getWorkspaceById);

// ✅ GET SETUP DATA (onboarding status)
workspaceRouter.get("/:workspaceId/setup", getWorkspaceSetup);

// Require workspace access for onboarding endpoints (but NOT active status)
workspaceRouter.use("/:workspaceId/onboarding", requireWorkspaceAccess());

// ✅ ONBOARDING ENDPOINTS
workspaceRouter.post("/:workspaceId/onboarding/channels", onboardingChannels);
workspaceRouter.post("/:workspaceId/onboarding/contact-form", onboardingContactForm);
workspaceRouter.post("/:workspaceId/onboarding/booking-setup", onboardingBookingSetup);
workspaceRouter.post("/:workspaceId/onboarding/forms", onboardingForms);
workspaceRouter.post("/:workspaceId/onboarding/inventory", onboardingInventory);
workspaceRouter.post("/:workspaceId/onboarding/staff", onboardingStaff);

// ✅ STAFF MANAGEMENT
workspaceRouter.post("/:workspaceId/staff/create", createStaff);

workspaceRouter.get("/:workspaceId/staff", getStaff);
workspaceRouter.delete("/:workspaceId/staff/:membershipId", removeStaff);

// ✅ ACTIVATE WORKSPACE
workspaceRouter.post("/:workspaceId/activate", activateWorkspace);


module.exports = workspaceRouter;
