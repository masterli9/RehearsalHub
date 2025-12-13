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
        let {
            title,
            songKey,
            length,
            bpm,
            status,
            bandId,
            notes,
            cloudurl,
            tags,
        } = req.body;

        if (!title || typeof title !== "string") {
            return res
                .status(400)
                .json({ error: "Title is required and must be a string" });
        }

        if (!bandId) {
            return res.status(400).json({ error: "bandId is required" });
        }

        title = title.trim();
        if (songKey && typeof songKey === "string") songKey = songKey.trim();
        if (status && typeof status === "string") status = status.trim();
        if (notes && typeof notes === "string") notes = notes.trim();
        if (cloudurl && typeof cloudurl === "string")
            cloudurl = cloudurl.trim();

        if (title.length === 0) {
            return res.status(400).json({ error: "Title cannot be empty" });
        }
        if (title.length > 255) {
            return res
                .status(400)
                .json({ error: "Title must be 255 characters or less" });
        }

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
            // Enforce integer bounds for PostgreSQL smallint, but user should only enter 1..32767 (app enforced)
            if (bpmInt < 1) {
                return res
                    .status(400)
                    .json({ error: "BPM should be at least 1" });
            }
            if (bpmInt > 32767) {
                return res
                    .status(400)
                    .json({ error: "BPM should be at most 32767" });
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
        const songId = insertSong.rows[0].song_id;

        // Handle tags
        let tagIds = [];
        if (tags && Array.isArray(tags) && tags.length > 0) {
            for (const tagName of tags) {
                // Check if tag exists for the band or is a global tag
                let tagResult = await pool.query(
                    "SELECT tag_id FROM tags WHERE name = $1 AND (band_id = $2 OR band_id IS NULL)",
                    [tagName, bandIdInt]
                );

                if (tagResult.rows.length === 0) {
                    // If tag doesn't exist, create it as a band-specific tag
                    tagResult = await pool.query(
                        "INSERT INTO tags (name, band_id) VALUES ($1, $2) RETURNING tag_id",
                        [tagName, bandIdInt]
                    );
                }
                tagIds.push(tagResult.rows[0].tag_id);
            }
        }
        // insert record into song_tags
        for (const tagId of tagIds) {
            const check = await pool.query(
                "INSERT INTO song_tags (song_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
                [songId, tagId]
            );
            if (check.rows.length === 0) {
                return res
                    .status(400)
                    .json({ error: "Failed to add tag to song" });
            }
        }

        const song = insertSong.rows[0];
        res.status(201).json(song);
    } catch (error) {
        console.error("Error creating song: ", error);
        res.status(500).json({ error: "Server error (song post)" });
    }
};

/**
 * Issue (see @file_context_0): The previous query attempts to select a multi-column array using:
 *   ARRAY(SELECT t.name, t.color, t.tag_id ...)
 * This returns a "subquery must return only one column" error in PostgreSQL because ARRAY(SELECT ...)
 * can only be used with a single column.
 *
 * Fix: Instead, aggregate the tags using json_agg and json_build_object, which works as an array of objects in JS and PostgreSQL.
 */
export const getSongs = async (req, res) => {
    const { bandId, status, tags, search, limit = 20, offset = 0 } = req.query;

    // Validate and parse bandId
    const bandIdInt = parseInt(bandId, 10);
    if (isNaN(bandIdInt) || bandIdInt <= 0) {
        return res.status(400).json({
            error: "A valid bandId is required and must be a positive integer.",
        });
    }

    // Build up query
    /*
        Explanation of the query syntax below:

        - COALESCE(expr1, expr2):
            Returns the first non-null value in the list. Here, if the subquery returns null,
            COALESCE ensures we get an empty array ('[]') instead of null.

        - json_agg(expression):
            Aggregates row values into a JSON array. For example, json_agg(json_build_object(...)) turns multiple tag rows into a JSON array of tag objects.

        - json_build_object(key, value, ...):
            Constructs a new JSON object for each row with given key/value pairs. In this case,
            it creates an object with 'name', 'color', and 'tag_id' for each tag.

        - FILTER (WHERE ...):
            This is a PostgreSQL extension to apply a WHERE-like filter to aggregates
            (such as json_agg). Only rows satisfying this condition are included in the aggregate.

        The subquery below gathers all tags for the song s (the outer query's row) as
        an array of objects [{name, color, tag_id}, ...]. If there are no tags, 
        COALESCE outputs an empty array.
    */
    let query = `
        SELECT
            s.*,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'name', t.name,
                            'color', t.color,
                            'tag_id', t.tag_id
                        )
                    ) FILTER (WHERE t.tag_id IS NOT NULL)
                    FROM song_tags st
                    JOIN tags t ON st.tag_id = t.tag_id
                    WHERE st.song_id = s.song_id
                ),
                '[]'
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
        // Ensure tags is an array, as a single tag comes as a string from query params
        const tagIds = Array.isArray(tags) ? tags : [tags];
        params.push(tagIds);
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

export const addTag = async (req, res) => {
    const { bandId, color, name } = req.body;

    if (!bandId || !color || !name)
        return res
            .status(400)
            .json({ error: "Band ID, color, and name are required" });
    try {
        const exists = await pool.query(
            "SELECT * FROM tags WHERE name = $1 AND band_id = $2",
            [name, bandId]
        );
        if (exists.rows.length > 0) {
            console.error("This tag already exists.");
            return res.status(400).json({ error: "This tag already exists." });
        }
        const insert = await pool.query(
            "INSERT INTO tags (name, color, band_id) VALUES ($1, $2, $3) RETURNING *",
            [name, color, bandId]
        );
        const tag = insert.rows[0];
        res.status(201).json(tag);
    } catch (error) {
        console.error("Error adding tag: ", error);
        res.status(500).json({ error: "Server error (add tag)" });
    }
};
