import pool from "../db/pool.js";

/**
 * Logs an activity to the database.
 * @param {number} bandId - The ID of the band.
 * @param {number} userId - The internal user ID (not firebase_uid).
 * @param {string} actionText - The text describing the action (e.g. "shared a new guitar riff idea").
 * @param {string} actionType - The type of action (e.g. "idea_shared", "event_scheduled", "song_updated", "chat_message", "task_completed").
 */
export const logActivity = async (bandId, userId, actionText, actionType) => {
    try {
        if (!bandId || !userId || !actionText || !actionType) return;
        
        await pool.query(
            `INSERT INTO activities (band_id, user_id, action_text, action_type)
             VALUES ($1, $2, $3, $4)`,
            [bandId, userId, actionText, actionType]
        );
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};
