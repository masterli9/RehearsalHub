import pool from "../db/pool.js";
import { getUserIdByFirebaseUid } from "../utils/getUserId.js"
import { storage } from "../utils/firebaseAdmin.js";

const getBandMemberIdByUserId = async (user_uid, band_id) =>{
    const userId = await getUserIdByFirebaseUid(user_uid);
    const result = await pool.query(
        "SELECT band_member_id FROM band_members WHERE user_id = $1 AND band_id = $2",
        [userId, band_id]
    );
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0].band_member_id;
}

export const createIdea = async (req, res) => {
    try {
        let {
            title,
            description,
            length,
            // bpm,
            user_uid,
            band_id,
            cloudurl,
            // tags,
        } = req.body;

        if (!title || typeof title !== "string") {
            return res
                .status(400)
                .json({ error: "Title is required and must be a string" });
        }

        if (!user_uid || !band_id) {
            return res.status(400).json({ error: "user_uid and band_id are required" });
        }

        const band_member_id = await getBandMemberIdByUserId(user_uid, band_id);

        title = title.trim();
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

        const band_member_idInt = parseInt(band_member_id, 10);
        if (isNaN(band_member_idInt) || band_member_idInt <= 0) {
            return res
                .status(400)
                .json({ error: "band_member_id must be a positive integer" });
        }

        // Handle length/duration for interval: accept only MM:SS or HH:MM:SS, else null
        let lengthValue = null;
        if (length !== null && length !== undefined && length !== "") {
            if (typeof length === 'number') {
                const totalSeconds = Math.floor(length / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                lengthValue = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                let str = typeof length === "string" ? length.trim() : String(length).trim();
                // Accept formats like "MM:SS" or "H:MM:SS" only, to prevent "date/time field value out of range"
                // (This gives postgres "interval" type strings it can parse)
                // Accept e.g. "3:45", "1:23:45"
                if (/^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/.test(str)) {
                    // If MM:SS, convert to 0:MM:SS; postgres accepts both, but always good to make explicit
                    if (/^\d{1,2}:[0-5]\d$/.test(str)) {
                        str = `0:${str}`;
                    }
                    lengthValue = str;
                } else {
                    // For anything else (e.g. "7000") just ignore and save as null
                    lengthValue = null;
                }
            }
        }

        const cloudurlValue = cloudurl || null;

        const insertIdea = await pool.query(
            "INSERT INTO musideas (title, description, length, audiourl, band_member_id) VALUES ($1, $2, $3, $4, $5) RETURNING idea_id",
            [
                title,
                description,
                lengthValue,
                cloudurlValue,
                band_member_idInt,
            ]
        );
        const ideaId = insertIdea.rows[0].idea_id;

        const idea = insertIdea.rows[0];
        res.status(201).json(idea);
    } catch (error) {
        console.error("Error creating idea: ", error);
        res.status(500).json({ error: "Server error (idea post)" });
    }
};

export const getIdeas = async (req, res) => {
    const { band_id } = req.query;

    if (!band_id) {
        return res.status(400).json({ error: "band_id is required" });
    }

    try {
        const result = await pool.query(
            "SELECT mi.*, u.username FROM musideas mi JOIN band_members bm USING(band_member_id) JOIN users u ON bm.user_id = u.user_id WHERE bm.band_id = $1 ORDER BY mi.created_at DESC",
            [band_id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No ideas found for this band" });
        }
        const ideas = result.rows;

        const ideasWithUrls = await Promise.all(
            result.rows.map(async (idea) => {
                // If there is no audiourl, or it already looks like a full URL (legacy data), skip
                if (!idea.audiourl || idea.audiourl.startsWith("http")) {
                    return idea;
                }

                try {
                    // Generate a fresh URL valid for 1 hour
                    const [signedUrl] = await storage
                        .bucket(process.env.FIREBASE_STORAGE_BUCKET)
                        .file(idea.audiourl)
                        .getSignedUrl({
                            version: "v4",
                            action: "read",
                            expires: Date.now() + 60 * 60 * 1000, // 1 hour
                        });

                    return { ...idea, audiourl: signedUrl };
                } catch (e) {
                    console.error(
                        `Failed to sign url for idea ${idea.idea_id}`,
                        e
                    );
                    return idea;
                }
            })
        );

        res.status(200).json(ideasWithUrls);
    } catch (error) {
        console.error("Error getting ideas: ", error);
        res.status(500).json({ error: "Server error (idea get)" });
    }
}