import pool from "../db/pool.js";

const VALID_EVENT_TYPES = ["rehearsal", "concert", "recording"];

export const createEvent = async (req, res) => {
    try {
        let {
            title,
            type,
            date_time,
            description,
            bandId,
            place,
            length,
            songs,
        } = req.body;

        // Validate required fields
        if (!title || typeof title !== "string") {
            return res
                .status(400)
                .json({ error: "Title is required and must be a string" });
        }

        if (!type || typeof type !== "string") {
            return res.status(400).json({ error: "Type is required" });
        }

        if (!VALID_EVENT_TYPES.includes(type)) {
            return res.status(400).json({ error: "Invalid event type" });
        }

        if (!date_time) {
            return res
                .status(400)
                .json({ error: "Date and time are required" });
        }

        if (!bandId) {
            return res.status(400).json({ error: "bandId is required" });
        }

        title = title.trim();
        if (description && typeof description === "string")
            description = description.trim();
        if (place && typeof place === "string") place = place.trim();

        if (title.length === 0) {
            return res.status(400).json({ error: "Title cannot be empty" });
        }
        if (title.length > 255) {
            return res
                .status(400)
                .json({ error: "Title must be 255 characters or less" });
        }

        // Validate type-specific requirements
        if (type === "concert" && !place) {
            return res
                .status(400)
                .json({ error: "Place is required for concert events" });
        }

        const bandIdInt = parseInt(bandId, 10);
        if (isNaN(bandIdInt) || bandIdInt <= 0) {
            return res
                .status(400)
                .json({ error: "bandId must be a positive integer" });
        }

        // Validate and parse date_time (expect an ISO string with offset)
        let dateTimeValue;
        try {
            dateTimeValue = new Date(date_time);
            if (isNaN(dateTimeValue.getTime())) {
                return res
                    .status(400)
                    .json({ error: "Invalid date_time format" });
            }
        } catch (error) {
            return res.status(400).json({ error: "Invalid date_time format" });
        }

        // Validate length (interval type)
        let lengthValue = null;
        if (length !== null && length !== undefined && length !== "") {
            if (typeof length === "string") {
                lengthValue = length.trim() || null;
            } else {
                lengthValue = length;
            }
        }

        // Insert event
        const insertEvent = await pool.query(
            "INSERT INTO events (title, type, date_time, description, band_id, place, length) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING event_id, title, type, date_time, description, band_id, place, length",
            [
                title,
                type,
                dateTimeValue, // pass Date so pg stores timestamptz correctly
                description || null,
                bandIdInt,
                place || null,
                lengthValue,
            ]
        );

        const event = insertEvent.rows[0];

        // Handle songs for rehearsal events
        if (
            type === "rehearsal" &&
            songs &&
            Array.isArray(songs) &&
            songs.length > 0
        ) {
            const songIds = songs
                .map((s) => (typeof s === "number" ? s : parseInt(s, 10)))
                .filter((id) => !isNaN(id) && id > 0);

            if (songIds.length > 0) {
                // Verify songs belong to the band
                const songsCheck = await pool.query(
                    "SELECT song_id FROM songs WHERE song_id = ANY($1) AND band_id = $2",
                    [songIds, bandIdInt]
                );

                const validSongIds = songsCheck.rows.map((r) => r.song_id);

                // Insert event_songs relationships
                for (const songId of validSongIds) {
                    await pool.query(
                        "INSERT INTO event_songs (event_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                        [event.event_id, songId]
                    );
                }
            }
        }

        res.status(201).json(event);
    } catch (error) {
        console.error("Error creating event: ", error);
        res.status(500).json({ error: "Server error (create event)" });
    }
};

export const getEvents = async (req, res) => {
    const { bandId, type, limit = 100, offset = 0 } = req.query;

    // Validate and parse bandId
    const bandIdInt = parseInt(bandId, 10);
    if (isNaN(bandIdInt) || bandIdInt <= 0) {
        return res.status(400).json({
            error: "A valid bandId is required and must be a positive integer.",
        });
    }

    // Build query
    let query = `
        SELECT
            e.event_id,
            e.title,
            e.type,
            e.date_time,
            e.description,
            e.band_id,
            e.place,
            CASE 
                WHEN e.length IS NOT NULL 
                THEN e.length::text
                ELSE NULL
            END AS length,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'song_id', s.song_id,
                            'title', s.title,
                            'key', s.key,
                            'status', s.status
                        )
                    ) FILTER (WHERE s.song_id IS NOT NULL)
                    FROM event_songs es
                    JOIN songs s ON es.song_id = s.song_id
                    WHERE es.event_id = e.event_id
                ),
                '[]'
            ) AS songs
        FROM events e
        WHERE e.band_id = $1
    `;

    const params = [bandIdInt];
    let paramIndex = 2;

    if (type) {
        if (Array.isArray(type)) {
            params.push(type);
            query += ` AND e.type = ANY($${paramIndex})`;
        } else {
            params.push(type);
            query += ` AND e.type = $${paramIndex}`;
        }
        paramIndex++;
    }

    query += ` ORDER BY e.date_time ASC`;

    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    try {
        const result = await pool.query(query, params);

        // Format date_time for frontend
        // length is already formatted as string by PostgreSQL to_char function
        const formattedEvents = result.rows.map((event) => ({
            ...event,
            date_time: event.date_time.toISOString(),
            // length is already a string from to_char, or null
        }));

        res.status(200).json(formattedEvents);
    } catch (error) {
        console.error("Error fetching events: ", error);
        res.status(500).json({ error: "Server error (get events)" });
    }
};
