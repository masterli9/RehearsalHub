import express from "express";
import {
    addTag,
    createSong,
    getSongs,
    getTags,
    addSongFile,
    getSongFiles,
    deleteSongFile,
} from "../controllers/songsController.js";
import { songUploadUrl } from "../utils/songUploadUrl.js";

const router = express.Router();

router.post("/upload-url", songUploadUrl);
router.post("/create", createSong);
router.get("/", getSongs);
router.get("/tags/:bandId", getTags);
router.post("/tags/add", addTag);
router.post("/:songId/files/add", addSongFile);
router.get("/:songId/files", getSongFiles);
router.delete("/:songId/files/:file_id", deleteSongFile);

export default router;
