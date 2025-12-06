import express from "express";
import { songUploadUrl } from "../utils/songUploadUrl.js";
import { createSong, getSongs } from "../controllers/songsController.js";

const router = express.Router();

router.post("/upload-url", songUploadUrl);
router.post("/create", createSong);
router.get("/", getSongs);

export default router;
