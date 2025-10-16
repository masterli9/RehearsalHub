import pool from "../db/pool.js";
import { getUserIdByFirebaseUid } from "../utils/getUserId.js";

export const createBand = async (req, res) => {
    const { name, creator_id } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        // getUserIdByFirebaseUid is likely async/promise-based
        const convertedUserId = await getUserIdByFirebaseUid(creator_id);
        console.log("Creator ID: ", creator_id);
        console.log("Converted User ID: ", convertedUserId);

        // Insert into bands, return band_id, name, invite_code (schema: band_id, name, invite_code, created_at)
        const bandResult = await pool.query(
            "INSERT INTO bands (name, invite_code) VALUES ($1, $2) RETURNING band_id, name, invite_code",
            [name, inviteCode]
        );
        const band = bandResult.rows[0];

        // First, insert the band member and get their band_member_id (PK)
        const bandMemberResult = await pool.query(
            "INSERT INTO band_members (band_id, user_id) VALUES ($1, $2) RETURNING band_member_id",
            [band.band_id, convertedUserId]
        );
        const bandMemberId = bandMemberResult.rows[0].band_member_id;

        // Get the role_id for the "leader" role (create if not exists)
        let roleResult = await pool.query(
            "SELECT role_id FROM roles WHERE title = $1",
            ["leader"]
        );
        let roleId;
        if (roleResult.rows.length === 0) {
            // Create "leader" role if it doesn't exist
            const insertRole = await pool.query(
                "INSERT INTO roles (title) VALUES ($1) RETURNING role_id",
                ["leader"]
            );
            roleId = insertRole.rows[0].role_id;
        } else {
            roleId = roleResult.rows[0].role_id;
        }

        // Insert membership into member_roles with leader role
        await pool.query(
            "INSERT INTO member_roles (band_member_id, role_id) VALUES ($1, $2)",
            [bandMemberId, roleId]
        );

        res.status(201).json(band);
    } catch (error) {
        console.error("Error creating band: ", error);
        res.status(500).json({ error: "Server error" });
    }
};

export const joinBand = async (req, res) => {
    const { invite_code, user_id, roles } = req.body;

    if (!invite_code || !user_id) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const roleTitles = Array.isArray(roles) ? roles.map((r) => r.title) : [];

    try {
        const convertedUserId = await getUserIdByFirebaseUid(user_id);

        const bandResult = await pool.query(
            "SELECT band_id, name, invite_code FROM bands WHERE invite_code = $1",
            [invite_code]
        );

        if (bandResult.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Band with this invite code does not exist" });
        }

        const bandId = bandResult.rows[0].band_id;

        const checkMember = await pool.query(
            "SELECT * FROM band_members WHERE band_id = $1 AND user_id = $2",
            [bandId, convertedUserId]
        );

        if (checkMember.rows.length > 0) {
            return res
                .status(400)
                .json({ error: "User is already a member of this band" });
        }

        const memberResult = await pool.query(
            "INSERT INTO band_members (band_id, user_id) VALUES ($1, $2) RETURNING band_member_id",
            [bandId, convertedUserId]
        );
        const memberId = memberResult.rows[0].band_member_id;

        await pool.query("DELETE FROM member_roles WHERE band_member_id = $1", [
            memberId,
        ]);

        const roleResult = await pool.query(
            "SELECT role_id, title FROM roles WHERE title = ANY($1)",
            [roleTitles]
        );

        for (const role of roleResult.rows) {
            await pool.query(
                "INSERT INTO member_roles (band_member_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [memberId, role.role_id]
            );
        }

        res.status(200).json({ message: "Successfully joined band" });
    } catch (error) {
        console.error("Error while joining band: ", error);
        res.status(500).json({ error: "Server error" });
    }
};
export const getAllRoles = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT role_id, title FROM roles ORDER BY title ASC"
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching roles:", err);
        res.status(500).json({ error: "Server error while fetching roles" });
    }
};
