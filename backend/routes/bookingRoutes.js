// const express = require("express");
// const { getAllBookings, updateBookingStatus } = require("../controllers/bookingController");
// const { requireAuth } = require("../middlewares/auth");
// const { requireActiveWorkspace, requireWorkspaceAccess } = require("../middlewares/workspace");

// const bookingRouter = express.Router()

// bookingRouter.use(requireAuth())
// bookingRouter.use(requireActiveWorkspace())
// bookingRouter.use(requireWorkspaceAccess())

// bookingRouter.get("/", getAllBookings)
// bookingRouter.patch("/:id/status", updateBookingStatus)


// module.exports = bookingRouter

const express = require("express");
const { getAllBookings, updateBookingStatus } = require("../controllers/bookingController");
const { requireAuth } = require("../middlewares/auth");
const { requireActiveWorkspace, requireWorkspaceAccess } = require("../middlewares/workspace");

const bookingRouter = express.Router();

bookingRouter.use(requireAuth());
bookingRouter.use(requireWorkspaceAccess());   // load workspace first
bookingRouter.use(requireActiveWorkspace());  // then check active

bookingRouter.get("/", getAllBookings);
bookingRouter.patch("/:id/status", updateBookingStatus);

module.exports = bookingRouter;