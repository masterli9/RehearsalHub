import express from "express";
import {
    createBand,
    getAllRoles,
    getBandMembers,
    joinBand,
} from "../controllers/bandsController.js";

const router = express.Router();

router.post("/", createBand);
router.post("/join", joinBand);
router.get("/roles", getAllRoles);
router.get("/:band_id/members", getBandMembers);

export default router;
