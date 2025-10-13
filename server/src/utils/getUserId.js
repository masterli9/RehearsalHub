import pool from "../db/pool.js";

export const getUserIdByFirebaseUid = async (firebaseUid) => {
    try {
        const existing = await pool.query(
            "SELECT id FROM users WHERE firebase_uid = $1",
            [firebaseUid]
        );

        if (existing.rows.length > 0) {
            return existing.rows[0].id;
        }

        // const inserted = await pool.query(
        //     `INSERT INTO users (firebase_uid) VALUES ($1) RETURNING id`,
        //     [firebaseUid]
        // );

        // return inserted.rows[0].id;
    } catch (err) {
        console.error("getUserIdByFirebaseUid error:", err);
        throw err;
    }
};
