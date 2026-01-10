import express from "express";
import {
    createBand,
    getAllRoles,
    getBandMembers,
    joinBand,
    removeBandMember,
    makeLeader,
    removeLeader,
    updateBandName,
    updateMemberRoles,
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
router.put("/:band_id/make-leader/:user_id", makeLeader);
router.put("/:band_id/remove-leader/:user_id", removeLeader);
router.put("/:band_id/update-name", updateBandName);
router.put("/:band_id/update-member-roles/:user_id", updateMemberRoles);

export default router;
