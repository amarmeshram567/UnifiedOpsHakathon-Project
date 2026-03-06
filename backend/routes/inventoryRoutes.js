const express = require("express");
const {
    getInventoryItems,
    updateInventoryItem,
    adjustInventory,
} = require("../controllers/inventoryController");
const { requireAuth } = require("../middlewares/auth");
const { requireActiveWorkspace, requireWorkspaceAccess } = require("../middlewares/workspace");

const inventoryRouter = express.Router();

// Auth + workspace access required for all inventory routes
inventoryRouter.use(requireAuth());
inventoryRouter.use(requireWorkspaceAccess());
inventoryRouter.use(requireActiveWorkspace());

// ✅ GET ALL INVENTORY ITEMS
inventoryRouter.get("/", getInventoryItems);

// ✅ UPDATE INVENTORY ITEM
inventoryRouter.patch("/:id", updateInventoryItem);

// ✅ ADJUST INVENTORY QUANTITY
inventoryRouter.post("/:id/adjust", adjustInventory);

module.exports = inventoryRouter;
