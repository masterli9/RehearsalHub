import express from "express";
import {
	getSetlists,
	getSetlistDetails,
	createSetlist,
	updateSetlist,
	deleteSetlist,
} from "../controllers/setlistsController.js";

const router = express.Router();

router.post("/", createSetlist);
router.get("/band/:bandId", getSetlists);
router.get("/:id", getSetlistDetails);
router.put("/:id", updateSetlist);
router.delete("/:id", deleteSetlist);

export default router;
