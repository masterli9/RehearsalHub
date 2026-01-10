import pool from "../db/pool.js";
import { storage } from "../utils/firebaseAdmin.js";

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

        let result;
        if (photo_url === null || photo_url === undefined) {
            result = await pool.query(
                "INSERT INTO users (firebase_uid, email, username) VALUES ($1, $2, $3) RETURNING *",
                [uid, email, username]
            );
        } else {
            result = await pool.query(
                "INSERT INTO users (firebase_uid, email, username, photourl) VALUES ($1, $2, $3, $4) RETURNING *",
                [uid, email, username, photo_url]
            );
        }

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

export const editUser = async (req, res) => {
    const { uid } = req.body;

    if (!uid) return res.status(400).json({ error: "Missing required fields" });
    try {
        const { username, photoURL } = req.body;

        if (username && !/^[a-z0-9_.-]{3,30}$/i.test(username)) {
            return res.status(400).json({ error: "Invalid username format" });
        }

        if (username) {
            const check = await pool.query(
                "SELECT user_id FROM users WHERE LOWER(username) = LOWER($1) AND firebase_uid <> $2",
                [username, uid]
            );
            if (check.rows.length > 0) {
                return res.status(409).json({ error: "USERNAME_TAKEN" });
            }
        }

        // build dynamic update
        const fields = [];
        const values = [];
        let idx = 1;
        if (username !== undefined) {
            fields.push(`username = $${idx++}`);
            values.push(username);
        }
        if (photoURL !== undefined) {
            fields.push(`photourl = $${idx++}`);
            values.push(photoURL);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        const query = `UPDATE users SET ${fields.join(
            ", "
        )} WHERE firebase_uid = $${idx} RETURNING user_id, firebase_uid, email, username, photourl`;
        values.push(uid);

        const result = await pool.query(query, values);
        return res.json(result.rows[0]);
    } catch (err) {
        console.error("editUser error", err);
        return res.status(500).json({ error: "server_error" });
    }
};

export const finalizeAvatarUpload = async (req, res) => {
    const { path } = req.body;
    if (!path) {
        return res.status(400).json({ error: "Missing file path" });
    }

    try {
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);

        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ error: "File not found at path" });
        }

        // Make the file publicly readable
        await file.makePublic();

        // The public URL can be used to access the file via HTTP
        const publicUrl = file.publicUrl();

        return res.json({ publicUrl });
    } catch (err) {
        console.error("Error finalizing avatar upload:", err);
        return res.status(500).json({ error: "Failed to make file public" });
    }
};
