import pool from "../db/pool.js";

export const registerUser = async (req, res) => {
    const { uid, email, username, photo_url } = req.body;

    if (!uid || !email || !username) {
        return res
            .status(400)
            .json({ error: "Missing required register fields" });
    }

    try {
        // Check if firebase_uid already exists
        const existingUid = await pool.query(
            "SELECT * FROM users WHERE firebase_uid = $1",
            [uid]
        );
        if (existingUid.rows.length > 0) {
            return res.status(200).json(existingUid.rows[0]); // Return existing user instead of error
        }

        // Check if email already exists (for conflict detection)
        const existingEmail = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({
                error: "Email is already registered with a different account",
            });
        }

        // Check if username already exists (case-insensitive)
        const existingUsername = await pool.query(
            "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
            [username]
        );
        if (existingUsername.rows.length > 0) {
            // Generate a unique username for Google users
            const uniqueUsername = username + "_" + uid.slice(0, 6);
            const result = await pool.query(
                "INSERT INTO users (firebase_uid, email, username, photourl) VALUES ($1, $2, $3, $4) RETURNING *",
                [uid, email, uniqueUsername, photo_url]
            );
            return res.status(201).json(result.rows[0]);
        }

        const result = await pool.query(
            "INSERT INTO users (firebase_uid, email, username, photourl) VALUES ($1, $2, $3, $4) RETURNING *",
            [uid, email, username, photo_url]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error inserting user: ", error);
        res.status(500).json({ error: "Server error" });
    }
};

export const getUserByUid = async (req, res) => {
    const { uid } = req.params;

    if (!uid) {
        return res.status(400).json({ error: "Missing UID" });
    }

    try {
        const result = await pool.query(
            "SELECT user_id, firebase_uid, email, username, photourl FROM users WHERE firebase_uid = $1",
            [uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching user by UID:", error);
        res.status(500).json({ error: "Server error" });
    }
};

export const getBandsForUser = async (req, res) => {
    const { uid } = req.params;

    if (!uid) return res.status(400).json({ error: "Missing required fields" });

    try {
        const result = await pool.query(
            `SELECT b.band_id, b.name, b.invite_code
             FROM bands b
             JOIN band_members bm ON b.band_id = bm.band_id
             JOIN users u ON u.user_id = bm.user_id
             WHERE u.firebase_uid = $1`,
            [uid]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error while loading bands: ", error);
        res.status(500).json({ error: "Server error" });
    }
};
