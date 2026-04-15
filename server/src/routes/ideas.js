import express from "express";
import { ideaUploadUrl } from "../utils/ideaUploadUrl.js";
import { createIdea, getIdeas, getRecentIdeas, updateIdea, toggleFavoriteIdea } from "../controllers/ideasController.js";

const router = express.Router();

router.post("/upload-url", ideaUploadUrl);
router.post("/create", createIdea);
router.get("/get", getIdeas);
router.get("/get-recent", getRecentIdeas);
router.put("/:idea_id", updateIdea);
router.patch("/:idea_id/favorite", toggleFavoriteIdea);

export default router;
