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
            capacity: 3,
            refillAmount: 1,
            refillIntervalMs: 2000,
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
        typingBuckets.set(uid, b);
    }
    return b;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://192.168.88.240:3000",
            "http://10.20.5.4:3000",
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
        socket.data.user = {
            uid: decoded.uid,
            email: decoded.email ?? null,
        };
        return next();
    } catch (err) {
        return next(console.error("Error verifying token:", err));
    }
});

io.on("connection", async (socket) => {
    if (!socket.data?.user?.uid) {
        return socket.disconnect(true);
    }
    const { uid } = socket.data.user;
    console.log("socket connected", socket.id, socket.data.user);

    socket.on("band:select", async ({ bandId }, ack) => {
        try {
            const id = Number(bandId);
            if (!Number.isInteger(id)) {
                return ack?.({ ok: false, error: "invalid-band-id", tempId });
            }

            const q = await pool.query(
                "SELECT bm.band_member_id, u.username FROM band_members bm JOIN users u USING(user_id) WHERE u.firebase_uid = $1 AND bm.band_id = $2 LIMIT 1",
                [uid, id]
            );
            if (q.rows.length === 0) {
                return ack?.({ ok: false, error: "not-a-member" });
            }

            for (const room of socket.rooms) {
                if (room.startsWith("band:")) {
                    socket.leave(room);
                }
            }

            const bandMemberId = q.rows[0].band_member_id;
            socket.data.activeBandId = id;
            socket.data.bandMemberId = bandMemberId;
            socket.data.user.username = q.rows[0].username;

            socket.join(`band:${id}`);
            ack?.({ ok: true });
            console.log(
                `User ${uid} (${socket.data.user.username}) joined band ${id}`
            );
        } catch (error) {
            console.error("band:select failed", error);
            ack?.({ ok: false, error: "server-error" });
        }
    });

    socket.on("typing:start", ({ bandId }) => {
        const bucket = getTypingBucket(uid);
        if (!bucket.tryRemove(1)) return;
        io.to(`band:${bandId}`).emit("typing:state", { uid, isTyping: true });
    });
    socket.on("typing:stop", ({ bandId }) => {
        const bucket = getTypingBucket(uid);
        if (!bucket.tryRemove(1)) return;
        io.to(`band:${bandId}`).emit("typing:state", { uid, isTyping: false });
    });

    socket.on("message:send", async ({ text, tempId }, ack) => {
        const bandId = socket.data.activeBandId;
        if (!Number.isInteger(bandId)) {
            return ack?.({ ok: false, error: "no-active-band", tempId });
        }
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
                "SELECT bm.band_member_id, u.username FROM band_members bm JOIN users u USING(user_id) WHERE u.firebase_uid = $1 AND bm.band_id = $2",
                [socket.data.user.uid, bandId]
            );

            if (q1.rows.length === 0) {
                return ack?.({ ok: false, error: "not-a-member", tempId });
            }

            const bandMemberId = q1.rows[0].band_member_id;
            const username = q1.rows[0].username;

            const q2 = await pool.query(
                "INSERT INTO messages (text, band_member_id) VALUES ($1, $2) RETURNING message_id, text, sent_at",
                [text.trim(), bandMemberId]
            );
            const date = new Date(q2.rows[0].sent_at).toISOString();

            const msg = {
                id: q2.rows[0].message_id,
                message_id: q2.rows[0].message_id,
                text: q2.rows[0].text,
                sent_at: date,
                bandId,
                author: { bandMemberId: bandMemberId, username: username },
            };

            ack?.({ ok: true, message: msg, tempId });

            io.to(`band:${bandId}`).emit("message:new", msg);

            io.emit("message:new", { ...msg, tempId });
        } catch (error) {
            console.error("Error sending message", error);
            ack?.({ ok: false, error: "server-error", tempId });
        }
    });
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => console.log(`API+Sockets on :${PORT}`));
