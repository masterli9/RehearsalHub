import express from "express";
import {
    createSong,
    getSongs,
    getTags,
} from "../controllers/songsController.js";
import { songUploadUrl } from "../utils/songUploadUrl.js";

const router = express.Router();

router.post("/upload-url", songUploadUrl);
router.post("/create", createSong);
router.get("/", getSongs);
router.get("/tags/:bandId", getTags);

export default router;
