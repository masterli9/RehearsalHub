import express from "express";
import {
    getBandsForUser,
    registerUser,
    getUserByUid,
    editUser,
    finalizeAvatarUpload,
} from "../controllers/usersController.js";
import { userUploadUrl } from "../utils/userUploadUrl.js";
const router = express.Router();

router.post("/", registerUser);
router.get("/:uid/bands", getBandsForUser);
router.get("/uid/:uid", getUserByUid);
router.patch("/me", editUser);
router.post("/avatar-upload-url", userUploadUrl);
router.post("/finalize-avatar-upload", finalizeAvatarUpload);

export default router;
