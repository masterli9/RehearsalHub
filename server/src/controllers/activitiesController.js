import pool from "../db/pool.js";
import { getUserIdByFirebaseUid } from "../utils/getUserId.js";

export const getActivities = async (req, res) => {
    const { bandId } = req.query;

    if (!bandId) {
        return res.status(400).json({ error: "Missing bandId" });
    }

    try {
        const result = await pool.query(
            `SELECT a.activity_id, a.band_id, a.user_id, u.username, u.firebase_uid, a.action_text, a.action_type, a.created_at
             FROM activities a
             LEFT JOIN users u ON a.user_id = u.user_id
             WHERE a.band_id = $1
             ORDER BY a.created_at DESC
             LIMIT 20`,
            [bandId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Failed to fetch activities" });
    }
};

export const createActivity = async (req, res) => {
    const { band_id, firebase_uid, action_text, action_type } = req.body;

    if (!band_id || !firebase_uid || !action_text || !action_type) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const userId = await getUserIdByFirebaseUid(firebase_uid);
        
        const result = await pool.query(
            `INSERT INTO activities (band_id, user_id, action_text, action_type)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [band_id, userId, action_text, action_type]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating activity:", error);
        res.status(500).json({ error: "Failed to create activity" });
    }
};
