const express = require("express");
const {
    getConversations,
    getConversationDetail,
    replyToConversation,
    addInboundMessage,
} = require("../controllers/inboxController");
const { requireAuth } = require("../middlewares/auth");
const { requireActiveWorkspace, requireWorkspaceAccess } = require("../middlewares/workspace");

const inboxRouter = express.Router();

// Auth + workspace access required for all inbox routes
inboxRouter.use(requireAuth());
inboxRouter.use(requireWorkspaceAccess());
inboxRouter.use(requireActiveWorkspace());

// ✅ GET ALL CONVERSATIONS
inboxRouter.get("/conversations", getConversations);

// ✅ GET CONVERSATION DETAIL
inboxRouter.get("/conversations/:id", getConversationDetail);

// ✅ POST REPLY TO CONVERSATION
inboxRouter.post("/conversations/:id/reply", replyToConversation);

// ✅ POST INBOUND MESSAGE (MVP demo endpoint)
inboxRouter.post("/conversations/:id/inbound", addInboundMessage);

module.exports = inboxRouter;
