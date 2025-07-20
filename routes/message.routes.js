import { Router } from "express";
import {
  getMessages,
  deleteMessage,
} from "../controllers/message.controller.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.get("/:id", authorize, getMessages);
router.delete("/:id", authorize, deleteMessage);

export default router;
