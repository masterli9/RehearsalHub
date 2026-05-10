import pool from "../db/pool.js";

// Helper to get user_id from firebase_uid
async function getUserIdByUid(uid) {
    const result = await pool.query("SELECT user_id FROM users WHERE firebase_uid = $1", [uid]);
    return result.rowCount ? result.rows[0].user_id : null;
}

// Create a new practice entry
export const createPractice = async (req, res) => {
    try {
        const userId = await getUserIdByUid(req.user.uid);
        if (!userId) return res.status(403).json({ error: "user-not-found" });

        const { bandId, durationMinutes, practiceDate, notes } = req.body;

        if (!durationMinutes) {
            return res.status(400).json({ error: "Duration is required" });
        }

        const newPractice = await pool.query(
            `INSERT INTO practices (user_id, band_id, duration_minutes, practice_date, notes) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                userId,
                bandId || null,
                durationMinutes,
                practiceDate || new Date(),
                notes || null,
            ]
        );

        res.json(newPractice.rows[0]);
    } catch (error) {
        console.error("Error in createPractice:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get practices for the logged-in user
export const getUserPractices = async (req, res) => {
    try {
        const userId = await getUserIdByUid(req.user.uid);
        if (!userId) return res.status(403).json({ error: "user-not-found" });

        const practices = await pool.query(
            `SELECT * FROM practices 
             WHERE user_id = $1 
             ORDER BY practice_date DESC, created_at DESC`,
            [userId]
        );

        res.json(practices.rows);
    } catch (error) {
        console.error("Error in getUserPractices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete a practice entry
export const deletePractice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = await getUserIdByUid(req.user.uid);
        if (!userId) return res.status(403).json({ error: "user-not-found" });

        // Ensure that the user deleting the practice actually owns it
        const result = await pool.query(
            "DELETE FROM practices WHERE practice_id = $1 AND user_id = $2 RETURNING *",
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Practice not found or unauthorized" });
        }

        res.json({ message: "Practice deleted successfully" });
    } catch (error) {
        console.error("Error in deletePractice:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
