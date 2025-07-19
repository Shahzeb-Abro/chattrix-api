import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller.js";
import { authorize } from "../middlewares/authorize.js";
const router = Router();

router.get("/", authorize, getAllUsers);

export default router;
