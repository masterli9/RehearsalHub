import express from "express";
import { ideaUploadUrl } from "../utils/ideaUploadUrl.js";
import { createIdea, getIdeas, getRecentIdeas } from "../controllers/ideasController.js";

const router = express.Router();

router.post("/upload-url", ideaUploadUrl);
router.post("/create", createIdea);
router.get("/get", getIdeas);
router.get("/get-recent", getRecentIdeas);

export default router;
