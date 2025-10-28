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

        // Get the role_id for the "Leader" role (create if not exists)
        let roleResult = await pool.query(
            "SELECT role_id FROM roles WHERE title = $1",
            ["Leader"]
        );
        let roleId;
        if (roleResult.rows.length === 0) {
            // Create "leader" role if it doesn't exist
            const insertRole = await pool.query(
                "INSERT INTO roles (title) VALUES ($1) RETURNING role_id",
                ["Leader"]
            );
            roleId = insertRole.rows[0].role_id;
        } else {
            roleId = roleResult.rows[0].role_id;
        }

        // Insert membership into member_roles with Leader role
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

        res.status(200).json({
            message: "Successfully joined band",
            band_id: bandId,
            name: bandResult.rows[0].name,
            invite_code: bandResult.rows[0].invite_code,
        });
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
export const getBandMembers = async (req, res) => {
    const { band_id } = req.params;
    const { user_id } = req.query; // Get user_id from query parameters

    if (!user_id) {
        return res.status(400).json({ error: "Missing user_id parameter" });
    }

    try {
        const result = await pool.query(
            `
        SELECT 
          u.firebase_uid,
          u.username,
          u.email,
          json_agg(r.title) AS roles
        FROM band_members bm
        JOIN users u ON bm.user_id = u.user_id
        LEFT JOIN member_roles mr ON bm.band_member_id = mr.band_member_id
        LEFT JOIN roles r ON mr.role_id = r.role_id
        WHERE bm.band_id = $1
        GROUP BY u.firebase_uid, u.username, u.email
        `,
            [band_id]
        );

        const members = result.rows;

        const currentUser = members.find(
            (member) => member.firebase_uid === user_id
        );

        res.json({
            members,
            currentUserRoles: currentUser ? currentUser.roles : [],
        });
    } catch (err) {
        console.error("Error fetching band members:", err);
        res.status(500).json({ error: "Failed to load band members" });
    }
};
export const removeBandMember = async (req, res) => {
    const { band_id, band_member_firebase_uid } = req.params;

    try {
        const convertedUserId = await getUserIdByFirebaseUid(
            band_member_firebase_uid
        );

        const checkMember = await pool.query(
            "SELECT * FROM band_members WHERE band_id = $1 AND user_id = $2",
            [band_id, convertedUserId]
        );

        if (checkMember.rows.length === 0) {
            return res.status(404).json({ error: "Band member not found" });
        }

        const bandMemberId = checkMember.rows[0].band_member_id;

        await pool.query("DELETE FROM band_members WHERE band_member_id = $1", [
            bandMemberId,
        ]);

        // Check if the band has any remaining members
        const remainingMembers = await pool.query(
            "SELECT COUNT(*) as count FROM band_members WHERE band_id = $1",
            [band_id]
        );

        const memberCount = parseInt(remainingMembers.rows[0].count);

        // If no members remain, delete the band
        if (memberCount === 0) {
            await pool.query("DELETE FROM bands WHERE band_id = $1", [band_id]);
            res.status(200).json({
                message:
                    "Member removed successfully. Band deleted as it has no remaining members.",
                bandDeleted: true,
            });
        } else {
            res.status(200).json({
                message: "Member removed successfully",
                bandDeleted: false,
            });
        }
    } catch (error) {
        console.error("Error removing band member: ", error);
        res.status(500).json({ error: "Server error" });
    }
};
