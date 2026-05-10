import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    createPractice,
    getUserPractices,
    deletePractice,
} from "../controllers/practicesController.js";

const router = express.Router();

router.post("/", authMiddleware, createPractice);
router.get("/", authMiddleware, getUserPractices);
router.delete("/:id", authMiddleware, deletePractice);

export default router;
