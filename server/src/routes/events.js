import express from "express";
import { createEvent, getEvents } from "../controllers/eventsController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/", getEvents);

export default router;

