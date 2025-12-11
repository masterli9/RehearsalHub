import pool from "../db/pool.js";

// Valid song keys from database CHECK constraint
const VALID_SONG_KEYS = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
    "Cm",
    "C#m",
    "Dm",
    "D#m",
    "Em",
    "Fm",
    "F#m",
    "Gm",
    "G#m",
    "Am",
    "A#m",
    "Bm",
];

// Valid statuses from database CHECK constraint
const VALID_STATUSES = ["draft", "finished", "ready"];

export const createSong = async (req, res) => {
    try {
        // Extract and trim string fields
        let { title, songKey, length, bpm, status, bandId, notes, cloudurl } =
            req.body;

        // Validate required fields
        if (!title || typeof title !== "string") {
            return res
                .status(400)
                .json({ error: "Title is required and must be a string" });
        }

        if (!bandId) {
            return res.status(400).json({ error: "bandId is required" });
        }

        // Trim string fields
        title = title.trim();
        if (songKey && typeof songKey === "string") songKey = songKey.trim();
        if (status && typeof status === "string") status = status.trim();
        if (notes && typeof notes === "string") notes = notes.trim();
        if (cloudurl && typeof cloudurl === "string")
            cloudurl = cloudurl.trim();

        // Validate title (max 255 chars, not empty after trim)
        if (title.length === 0) {
            return res.status(400).json({ error: "Title cannot be empty" });
        }
        if (title.length > 255) {
            return res
                .status(400)
                .json({ error: "Title must be 255 characters or less" });
        }

        // Validate songKey (max 4 chars, must be in valid keys list)
        if (songKey) {
            if (songKey.length > 4) {
                return res
                    .status(400)
                    .json({ error: "Song key must be 4 characters or less" });
            }
            if (!VALID_SONG_KEYS.includes(songKey)) {
                return res.status(400).json({ error: "Invalid song key" });
            }
        }

        // Validate status (max 20 chars, must be in valid statuses list)
        if (status) {
            if (status.length > 20) {
                return res
                    .status(400)
                    .json({ error: "Status must be 20 characters or less" });
            }
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
        }

        // Validate and convert bandId to integer
        const bandIdInt = parseInt(bandId, 10);
        if (isNaN(bandIdInt) || bandIdInt <= 0) {
            return res
                .status(400)
                .json({ error: "bandId must be a positive integer" });
        }

        // Validate and convert bpm to smallint (range: -32768 to 32767)
        let bpmValue = null;
        if (bpm !== null && bpm !== undefined && bpm !== "") {
            const bpmNum = Number(bpm);
            if (isNaN(bpmNum)) {
                return res.status(400).json({ error: "BPM must be a number" });
            }
            const bpmInt = Math.round(bpmNum);
            if (bpmInt < -32768 || bpmInt > 32767) {
                return res
                    .status(400)
                    .json({ error: "BPM must be between -32768 and 32767" });
            }
            if (bpmInt < 1) {
                return res
                    .status(400)
                    .json({ error: "BPM should be at least 1" });
            }
            bpmValue = bpmInt;
        }

        // Validate length (interval type - can be null or a valid interval string)
        // PostgreSQL accepts interval strings like '3:45', '1:05:22', '1 hour 30 minutes', etc.
        let lengthValue = null;
        if (length !== null && length !== undefined && length !== "") {
            if (typeof length === "string") {
                lengthValue = length.trim() || null;
            } else {
                lengthValue = length;
            }
        }

        // Validate cloudurl (text type, can be null)
        const cloudurlValue = cloudurl || null;

        // Validate notes (text type, can be null)
        const notesValue = notes || null;

        const insertSong = await pool.query(
            "INSERT INTO songs (title, key, length, notes, status, bpm, cloudurl, band_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING song_id",
            [
                title,
                songKey || null,
                lengthValue,
                notesValue,
                status || null,
                bpmValue,
                cloudurlValue,
                bandIdInt,
            ]
        );
        const song = insertSong.rows[0];
        res.status(201).json(song);
    } catch (error) {
        console.error("Error creating song: ", error);
        res.status(500).json({ error: "Server error (song post)" });
    }
};

export const getSongs = async (req, res) => {
    const { bandId, status, tags, search, limit = 20, offset = 0 } = req.query;

    // Validate and parse bandId
    const bandIdInt = parseInt(bandId, 10);
    if (isNaN(bandIdInt) || bandIdInt <= 0) {
        return res.status(400).json({
            error: "A valid bandId is required and must be a positive integer.",
        });
    }

    let query = `
        SELECT s.*, ARRAY(
            SELECT t.name
            FROM song_tags st
            JOIN tags t USING(tag_id)
            WHERE st.song_id = s.song_id
        ) AS tags
         FROM songs s
         WHERE s.band_id = $1
    `;

    const params = [bandIdInt];

    if (status) {
        params.push(status);
        if (Array.isArray(status)) {
            query += ` AND s.status = ANY($${params.length})`;
        } else {
            query += ` AND s.status = $${params.length}`;
        }
    }
    if (search) {
        params.push(`%${search}%`);
        query += ` AND s.title ILIKE $${params.length}`;
    }
    if (tags && tags.length > 0) {
        params.push(tags);
        query += ` AND s.song_id IN (
            SELECT song_id FROM song_tags WHERE tag_id = ANY($${params.length})
        )`;
    }

    query += ` ORDER BY s.song_id DESC`;

    params.push(limit);
    params.push(offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching songs: ", error);
        res.status(500).json({ error: "Server error (get songs)" });
    }
};

export const getTags = async (req, res) => {
    const { bandId } = req.params;

    if (!bandId) {
        return res.status(400).json({ error: "Band ID is required" });
    }
    try {
        const result = await pool.query(
            "SELECT t.name, t.tag_id, t.color FROM tags t WHERE t.band_id = $1 OR t.band_id IS NULL",
            [bandId]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No tags found for this band" });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching tags: ", error);
        res.status(500).json({ error: "Server error (get tags)" });
    }
};
