import express from "express";
import { ideaUploadUrl } from "../utils/ideaUploadUrl.js";

const router = express.Router();

router.post("/upload-url", ideaUploadUrl);

export default router;
