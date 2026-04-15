import pool from "./db/pool.js";
import fs from "fs";

async function runMigration() {
    try {
        const sql = fs.readFileSync("../migrations/add_ideas_metadata_and_tabs.sql", "utf-8");
        await pool.query(sql);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
}
runMigration();
