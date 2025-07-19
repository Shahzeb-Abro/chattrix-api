import { Router } from "express";
import { getMessages } from "../controllers/message.controller.js";

const router = Router();

router.get("/:id", getMessages);

export default router;
