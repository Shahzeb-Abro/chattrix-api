import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./utils/db.js";
import "colors";
import { Server } from "socket.io";
dotenv.config();

import passport from "passport";
import "./passport/google.js";

import cookieParser from "cookie-parser";

import globalErrorHandler from "./controllers/error.controller.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");
});

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

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
