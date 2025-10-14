import pool from "../db/pool.js";

export const getUserIdByFirebaseUid = async (firebaseUid) => {
    try {
        const existing = await pool.query(
            "SELECT user_id FROM users WHERE firebase_uid = $1",
            [firebaseUid]
        );

        if (existing.rows.length > 0) {
            return existing.rows[0].user_id;
        } else {
            throw new Error("User not found");
        }
    } catch (err) {
        console.error("getUserIdByFirebaseUid error:", err);
        throw err;
    }
};
