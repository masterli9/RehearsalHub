import express from "express";
import {
	createEvent,
	getEvents,
	updateEventSetlist,
} from "../controllers/eventsController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/", getEvents);
router.put("/:id/setlist", updateEventSetlist);

export default router;
