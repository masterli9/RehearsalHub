import crypto from "crypto";
import dotenv from "dotenv";
import { getUserIdByFirebaseUid } from "../utils/getUserId.js";
import { storage } from "./firebaseAdmin.js";

dotenv.config();

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
const bucket = storage.bucket(bucketName);

export const userUploadUrl = async (req, res) => {
    const { uid } = req.body;

    if (!uid) return res.status(400).json({ error: "Missing required fields" });
    try {
        const { filename, contentType } = req.body;

        if (!filename || typeof filename !== "string") {
            return res.status(400).json({ error: "filename required" });
        }
        const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const userId = await getUserIdByFirebaseUid(uid);

        // Add a unique component to avoid filename collision
        const uniqueSuffix =
            Date.now().toString() + "_" + crypto.randomBytes(8).toString("hex");
        const dest = `users/user_${userId}/avatars/${uniqueSuffix}_${sanitized}`;
        const file = bucket.file(dest);

        const [uploadUrl] = await file.getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + 15 * 60 * 1000,
            contentType: contentType || "image/jpeg",
        });

        return res.json({ uploadUrl, path: dest });
    } catch (err) {
        console.error("user upload url error", err);
        return res.status(500).json({ error: "failed to create upload url" });
    }
};
