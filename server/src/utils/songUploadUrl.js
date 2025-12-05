import dotenv from "dotenv";
import { storage } from "./firebaseAdmin.js";

dotenv.config();

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
const bucket = storage.bucket(bucketName);
export const songUploadUrl = async (req, res) => {
    const { filename, contentType, bandId } = req.body;
    try {
        const dest = `bands/${bandId}/songs/${filename}`;
        const file = bucket.file(dest);

        const [url] = await file.getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + 15 * 60 * 1000, // 15 min
            contentType: contentType || "application/octet-stream",
        });

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
            dest
        )}`;

        res.json({ uploadUrl: url, publicUrl, path: dest });
    } catch (error) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
};
