import express from "express";
import { getMessages } from "../controllers/messagesController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:bandId", authMiddleware, getMessages);

export default router;
