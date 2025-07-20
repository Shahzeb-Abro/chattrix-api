import { Router } from "express";
import { getAllUsers, getUserById } from "../controllers/user.controller.js";
import { authorize } from "../middlewares/authorize.js";
const router = Router();

router.get("/", authorize, getAllUsers);
router.get("/:id", authorize, getUserById);

export default router;
