const express = require("express")
const { getPublicWorkspaceInfo, submitContactForm, getAvailability, createBooking, getFormBooking, getFormToken, submitForm } = require("../controllers/publicController")
const publicRouter = express.Router()


publicRouter.get("/workspace/:slug", getPublicWorkspaceInfo)
publicRouter.post("/w/:slug/contact", submitContactForm);
publicRouter.get("/w/:slug/availability", getAvailability);
publicRouter.post("/w/:slug/book", createBooking);
publicRouter.get("/w/:slug/forms/:bookingId", getFormBooking);
publicRouter.get("/form/:token", getFormToken);
publicRouter.post("/form/:token/submit", submitForm)


module.exports = publicRouter