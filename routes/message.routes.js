import { Router } from "express";
import {
  getMessages,
  deleteMessage,
  markAsRead,
} from "../controllers/message.controller.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.get("/:id", authorize, getMessages);
router.delete("/:id", authorize, deleteMessage);
router.patch("/mark-as-read/:id", authorize, markAsRead);

export default router;
