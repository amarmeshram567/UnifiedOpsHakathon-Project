require("dotenv").config()
const express = require("express");
const cors = require("cors")
const morgan = require('morgan')
const { pool } = require("./config/db");
const authRouter = require("./routes/authRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const workspaceRouter = require("./routes/workspaceRoutes");
const dashboardRouter = require("./routes/dashboardRoutes");
const formRouter = require("./routes/formRoutes");
const inboxRouter = require("./routes/inboxRoutes");
const inventoryRouter = require("./routes/inventoryRoutes");
const publicRouter = require("./routes/publicRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(morgan("dev"));


app.get("/", (req, res) => {
    res.send("Server is live")
})



app.use("/api/auth", authRouter)
app.use("/api/public", publicRouter);

app.use("/api/bookings", bookingRouter)
app.use("/api/workspaces", workspaceRouter)
app.use("/api/dashboard", dashboardRouter)
app.use("/api/forms", formRouter)
app.use("/api/inbox", inboxRouter)
app.use("/api/inventory", inventoryRouter)

// Test DB connection before starting server
async function startServer() {
    try {
        await pool.query("SELECT 1");   // test query
        console.log("✅ Database connected successfully");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        process.exit(1); // stop app if DB not connected
    }
}

startServer();

