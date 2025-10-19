import express from "express";
import {
    createBand,
    getAllRoles,
    getBandMembers,
    joinBand,
    removeBandMember,
} from "../controllers/bandsController.js";

const router = express.Router();

router.post("/", createBand);
router.post("/join", joinBand);
router.get("/roles", getAllRoles);
router.get("/:band_id/members", getBandMembers);
router.delete(
    "/:band_id/remove-member/:band_member_firebase_uid",
    removeBandMember
);

export default router;
