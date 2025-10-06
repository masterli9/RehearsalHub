import express from "express";
import pool from "./db/pool.js";
import dotenv from "dotenv";

import usersRouter from "./routes/users.js";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use("/api/users", usersRouter);

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
