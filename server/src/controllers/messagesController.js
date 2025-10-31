import pool from "../db/pool.js";
import { encodeCursor, decodeCursor } from "../utils/cursor.js";
import authMiddleware from "../middleware/authMiddleware.js";

async function getBandMemberId(uid, bandId) {
    const q = await pool.query(
        "SELECT bm.band_member_id FROM band_members bm JOIN users u USING(user_id) WHERE u.firebase_uid = $1 AND bm.band_id = $2",
        [uid, bandId]
    );
    return q.rowCount ? q.rows[0].band_member_id : null;
}

export const getMessages = async (req, res) => {
    const uid = req.user.uid;
    const bandId = parseInt(req.params.bandId);
    if (!Number.isInteger(bandId))
        return res.status(400).json({ error: "invalid-band-id" });

    const bandMemberId = await getBandMemberId(uid, bandId);
    if (!bandMemberId) return res.status(403).json({ error: "not-a-member" });

    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
    let beforeSentAt = new Date();
    let beforeId = Number.MAX_SAFE_INTEGER;

    if (req.query.before) {
        const c = decodeCursor(req.query.before);
        if (!c || !c.sent_at || !c.message_id)
            return res.status(400).json({ error: "invalid-cursor" });
        beforeSentAt = new Date(c.sent_at);
        beforeId = c.message_id;
    }

    try {
        const result = await pool.query(
            `SELECT m.message_id, m.text, m.sent_at, bm.band_member_id, u.username, u.photourl
            FROM messages m JOIN band_members bm USING(band_member_id) 
            WHERE m.band_id = $1 AND (m.sent_at < $2 OR (m.sent_at = $2 AND m.message_id < $3)) 
            ORDER BY m.sent_at DESC, m.message_id DESC LIMIT $4`,
            [bandId, beforeSentAt, beforeId, limit]
        );

        const items = q.rows.map((row) => ({
            id: row.message_id,
            text: row.text,
            sent_at: row.sent_at,
            bandId,
            author: {
                bandMemberId: row.band_member_id,
                username: row.username,
                photourl: row.photourl,
            },
        }));

        let nextCursor = null;
        if (items.length > 0) {
            const last = items[items.length - 1];
            nextCursor = encodeCursor({
                sent_at: last.sent_at,
                message_id: last.id,
            });
        }

        res.json({ items, nextCursor, hasMore: items.length === limit });
    } catch (error) {
        console.error("Error getting messages:", error);
        res.status(500).json({ error: "server-error" });
    }
};
