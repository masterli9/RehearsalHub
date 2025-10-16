import express from "express";
import {
    createBand,
    getAllRoles,
    joinBand,
} from "../controllers/bandsController.js";

const router = express.Router();

router.post("/", createBand);
router.post("/join", joinBand);
router.get("/roles", getAllRoles);

export default router;
