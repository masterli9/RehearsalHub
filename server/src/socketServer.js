import http from "http";
import express from "express";
import { Server } from "socket.io";
import { adminAuth } from "./utils/firebaseAdmin.js";
import pool from "./db/pool.js";
import TokenBucket from "./utils/rateLimiter.js";

const messageBuckets = new Map();
const typingBuckets = new Map();

function getMessageBucket(uid) {
    let b = messageBuckets.get(uid);
    if (!b) {
        b = new TokenBucket({
            capacity: 5,
            refillAmount: 5,
            refillIntervalMs: 3000,
        });
        messageBuckets.set(uid, b);
    }
    return b;
}
function getTypingBucket(uid) {
    let b = typingBuckets.get(uid);
    if (!b) {
        b = new TokenBucket({
            capacity: 5,
            refillAmount: 5,
            refillIntervalMs: 1000,
        });
    }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://192.168.88.240:3000",
            /^http:\/\/192\.168\.\d+\.\d+:3000$/,
        ],
        credentials: true,
    },
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(console.error("No token provided"));
        const decoded = await adminAuth.verifyIdToken(token);
        socket.data.user = { uid: decoded.uid, email: decoded.email ?? null };
        return next();
    } catch (err) {
        return next(console.error("Error verifying token:", err));
    }
});

io.on("connection", async (socket) => {
    console.log("socket connected", socket.id, socket.data.user);
    const { uid } = socket.data.user;
    try {
        const { rows } = await pool.query(
            "SELECT bm.band_id FROM band_members bm JOIN users u USING(user_id) WHERE u.firebase_uid = $1",
            [uid]
        );
        if (rows.length === 0) {
            console.error("User is not a member of any band");
            socket.disconnect(true);
        }

        rows.forEach((row) => socket.join(`band:${row.band_id}`));

        console.log(
            `User ${uid} joined: ${rows.map((row) => row.band_id).join(", ")}`
        );
    } catch (error) {
        console.error("band join failed", error);
        socket.disconnect(true);
    }

    socket.on("typig:start", ({ bandId }) => {
        const bucket = getTypingBucket(uid);
        if (!bucket.tryRemove(1)) return;
        io.to(`band:${bandId}`).emit("typing:state", { uid, isTyping: true });
    });
    socket.on("typing:stop", ({ bandId }) => {
        const bucket = getTypingBucket(uid);
        if (!bucket.tryRemove(1)) return;
        io.to(`band:${bandId}`).emit("typing:state", { uid, isTyping: false });
    });

    socket.on("message:send", async ({ bandId, text, tempId }, ack) => {
        if (
            typeof text !== "string" ||
            !text.trim() ||
            !Number.isInteger(bandId) ||
            text.trim().length > 1200
        ) {
            return ack?.({ ok: false, error: "invalid-payload", tempId });
        }
        const bucket = getMessageBucket(uid);
        if (!bucket.tryRemove(1)) {
            return ack?.({
                ok: false,
                error: "rate-limited",
                retryInMs: 1500,
                tempId,
            });
        }
        try {
            const q1 = await pool.query(
                "SELECT bm.band_member_id FROM band_members bm JOIN users u USING(user_id) WHERE u.firebase_uid = $1 AND bm.band_id = $2",
                [socket.data.user.uid, bandId]
            );

            if (q1.rows.length === 0) {
                return ack?.({ ok: false, error: "not-a-member", tempId });
            }

            const bandMemberId = q1.rows[0].band_member_id;

            const q2 = await pool.query(
                "INSERT INTO messages (text, band_member_id) VALUES ($1, $2) RETURNING message_id, text, sent_at",
                [text.trim(), bandMemberId]
            );

            const msg = {
                message_id: q2.rows[0].message_id,
                text: q2.rows[0].text,
                sent_at: q2.rows[0].sent_at,
                bandId,
                author: { bandMemberId: bandMemberId },
            };

            ack?.({ ok: true, message: msg, tempId });

            io.to(`band:${bandId}`).emit("message:new", msg);
        } catch (error) {
            console.error("Error sending message", error);
            ack?.({ ok: false, error: "server-error", tempId });
        }
    });
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => console.log(`API+Sockets on :${PORT}`));
