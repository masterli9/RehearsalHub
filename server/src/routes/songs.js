import express from "express";
import { songUploadUrl } from "../utils/songUploadUrl.js";
import { createSong } from "../controllers/songsController.js";

const router = express.Router();

router.post("/upload-url", songUploadUrl);
router.post("/create", createSong);

export default router;
