import express from "express";
import pool from "./db/pool.js";
import dotenv from "dotenv";

import usersRoutes from "./routes/users.js";
import bandsRoutes from "./routes/bands.js";
import messagesRoutes from "./routes/messages.js";
import songsRoutes from "./routes/songs.js";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use("/api/users", usersRoutes);
app.use("/api/bands", bandsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/songs", songsRoutes);

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
});
