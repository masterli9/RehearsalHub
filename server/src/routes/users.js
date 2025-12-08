import express from "express";
import {
    getBandsForUser,
    registerUser,
    getUserByUid,
} from "../controllers/usersController.js";
const router = express.Router();

router.post("/", registerUser);
router.get("/:uid/bands", getBandsForUser);
router.get("/uid/:uid", getUserByUid);

export default router;
