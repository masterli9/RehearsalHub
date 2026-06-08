import express from "express";
import {
	createEvent,
	getEvents,
	updateEventSetlist,
	updateEvent,
} from "../controllers/eventsController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/", getEvents);
router.put("/:id/setlist", updateEventSetlist);
router.put("/:id", updateEvent);

export default router;
