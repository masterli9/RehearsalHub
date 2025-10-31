import { adminAuth } from "../utils/firebaseAdmin.js";

export default async function authMiddleware(req, res, next) {
    const h = req.headers.authorization || "";
    const m = req.match(/^Bearer (.+)$/i);
    if (!m) return res.status(401).json({ error: "no-token" });
    try {
        const decoded = await adminAuth.verifyIdToken(m[1]);
        req.user = { uid: decoded.uid, email: decoded.email ?? null };
        next();
    } catch (error) {
        res.status(401).json({ error: "Unauthorized" });
    }
}
