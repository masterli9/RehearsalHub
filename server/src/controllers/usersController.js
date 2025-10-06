import pool from "../db/pool.js";

export const registerUser = async (req, res) => {
    const { uid, email, username } = req.body;

    if (!uid || !email || !username) {
        return res
            .status(400)
            .json({ error: "Missing required register fields" });
    }

    try {
        const existing = await pool.query(
            "SELECT * FROM users WHERE firebase_uid = $1",
            [uid]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        const result = await pool.query(
            "INSERT INTO users (firebase_uid, email, username) VALUES ($1, $2, $3) RETURNING *",
            [uid, email, username]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error inserting user: ", error);
        res.status(500).json({ error: "Server error" });
    }
};
