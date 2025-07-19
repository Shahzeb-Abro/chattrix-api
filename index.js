import express from "express";
const app = express();
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./utils/db.js";
import "colors";
dotenv.config();

import passport from "passport";
import "./passport/google.js";

import cookieParser from "cookie-parser";

import globalErrorHandler from "./controllers/error.controller.js";
import authRoutes from "./routes/auth.routes.js";

app.use(passport.initialize());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());

app.set("view engine", "pug");

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Deployment successful");
});

app.use("/api/v1/auth", authRoutes);

app.use(globalErrorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
