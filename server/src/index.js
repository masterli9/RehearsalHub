import express from "express";
import pool from "./db/pool.js";
import dotenv from "dotenv";
import cron from "node-cron";

import usersRoutes from "./routes/users.js";
import bandsRoutes from "./routes/bands.js";
import messagesRoutes from "./routes/messages.js";
import songsRoutes from "./routes/songs.js";
import eventsRoutes from "./routes/events.js";
import ideasRoutes from "./routes/ideas.js";
import { cleanupUnverifiedUsers } from "./utils/cleanupUnverifiedUsers.js";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use("/api/users", usersRoutes);
app.use("/api/bands", bandsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/songs", songsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/ideas", ideasRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log("DB config: ", process.env.DB_HOST, process.env.DB_PORT);
    pool.query("SELECT NOW()", (err, res) => {
        if (err) {
            console.error("Error connecting to the database", err);
        } else {
            console.log("Database connected successfully at:", res.rows[0].now);
        }
    });

    // Schedule cleanup job for unverified users
    // Runs daily at 2:00 AM
    // Set CLEANUP_UNVERIFIED_DAYS environment variable to change the threshold (default: 7 days)
    const cleanupDays = parseInt(process.env.CLEANUP_UNVERIFIED_DAYS) || 7;

    cron.schedule("0 2 * * *", async () => {
        console.log("[Cron] Starting scheduled cleanup of unverified users...");
        try {
            const result = await cleanupUnverifiedUsers(cleanupDays);
            console.log(
                `[Cron] Cleanup completed: ${result.deleted} users deleted, ${result.errors} errors`
            );
        } catch (error) {
            console.error("[Cron] Cleanup job failed:", error);
        }
    });

    console.log(
        `[Cron] Scheduled cleanup job: Daily at 2:00 AM (deleting unverified users older than ${cleanupDays} days)`
    );
});
