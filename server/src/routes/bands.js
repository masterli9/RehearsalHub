import express from "express";
import { createBand, joinBand } from "../controllers/bandsController.js";

const router = express.Router();

router.post("/", createBand);
router.post("/join", joinBand);

export default router;
