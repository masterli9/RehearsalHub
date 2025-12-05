import pool from "../db/pool.js";
import { getUserIdByFirebaseUid } from "../utils/getUserId.js";

export const createSong = async (req, res) => {
    const { title, songKey, length, bpm, status, bandId, notes, cloudurl } =
        req.body;
    try {
        const insertSong = await pool.query(
            "INSERT INTO songs (title, key, length, notes, status, bpm, cloudurl, band_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING song_id",
            [title, songKey, length, notes, status, bpm, cloudurl, bandId]
        );
        const song = insertSong.rows[0];
        res.status(201).json(song);
    } catch (error) {
        console.error("Error creating song: ", error);
        res.status(500).json({ error: "Server error (song post)" });
    }
};
