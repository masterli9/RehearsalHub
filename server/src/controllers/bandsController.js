import pool from "../db/pool.js";
import { getUserIdByFirebaseUid } from "../utils/getUserId.js";

export const createBand = async (req, res) => {
    const { name, creator_id } = req.body;

    if (!name || !invite_code) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    try {
        const convertedUserId = getUserIdByFirebaseUid(creator_id);

        const bandResult = await pool.query(
            "INSERT INTO bands (name, invite_code) VALUES ($1, $2) RETURNING band_id, name, invite_code",
            [name, inviteCode]
        );
        const band = bandResult.rows[0];

        await pool.query(
            "INSERT INTO band_members (band_id, user_id, role) VALUES ($1, $2, 'leader')",
            [band.id, convertedUserId]
        );

        res.status(201).json(band);
    } catch (error) {
        console.error("Error creating band: ", error);
        res.status(500).json({ error: "Server error" });
    }
};

export const joinBand = async (req, res) => {
    const { invite_code, user_id } = req.body;

    if (!invite_code || !user_id) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const convertedUserId = getUserIdByFirebaseUid(user_id);

        const bandResult = await pool.query(
            "SELECT id, name, invite_code FROM bands WHERE invite_code = $1",
            [invite_code]
        );

        if (bandResult.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Band with this invite code does not exist" });
        }

        const band = bandResult.rows[0];

        const checkMember = await pool.query(
            "SELECT * FROM band_members WHERE band_id = $1 AND user_id = $2",
            [band.id, convertedUserId]
        );

        if (checkMember.rows.length > 0) {
            return res
                .status(400)
                .json({ error: "User is already a member of this band" });
        }

        await pool.query(
            "INSERT INTO band_members (band_id, user_id, role) VALUES ($1, $2, 'member')",
            [band.id, convertedUserId] // TODO: role should be chosen by user
        );

        res.status(200).json(band);
    } catch (error) {
        console.error("Error while joining band: ", error);
        res.status(500).json({ error: "Server error" });
    }
};
