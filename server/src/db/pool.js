import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:
        process.env.DB_HOST === "localhost" ||
        process.env.DB_HOST === "127.0.0.1"
            ? false
            : { rejectUnauthorized: false },
});

export default pool;
