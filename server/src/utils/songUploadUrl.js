import dotenv from "dotenv";
import { storage } from "./firebaseAdmin.js";

dotenv.config();

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
const bucket = storage.bucket(bucketName);
export const songUploadUrl = async (req, res) => {
    try {
        let { filename, contentType, bandId } = req.body;

        // Validate required fields
        if (!filename || typeof filename !== "string") {
            return res
                .status(400)
                .json({ error: "filename is required and must be a string" });
        }

        if (!bandId) {
            return res.status(400).json({ error: "bandId is required" });
        }

        // Trim string fields
        filename = filename.trim();
        if (contentType && typeof contentType === "string") {
            contentType = contentType.trim();
        }

        // Validate filename is not empty after trim
        if (filename.length === 0) {
            return res.status(400).json({ error: "filename cannot be empty" });
        }

        // Validate and convert bandId to integer
        const bandIdInt = parseInt(String(bandId).trim(), 10);
        if (isNaN(bandIdInt) || bandIdInt <= 0) {
            return res
                .status(400)
                .json({ error: "bandId must be a positive integer" });
        }

        // Sanitize filename to prevent path traversal
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

        const dest = `bands/band_${bandIdInt}/songs/${sanitizedFilename}`;
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
