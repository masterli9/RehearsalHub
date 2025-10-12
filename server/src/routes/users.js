import express from "express";
import {
    getBandsForUser,
    registerUser,
} from "../controllers/usersController.js";
const router = express.Router();

router.post("/", registerUser);
router.get("/:uid/bands", getBandsForUser);

export default router;
