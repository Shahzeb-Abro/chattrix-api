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
import Message from "./models/message.model.js";
import messageRoutes from "./routes/message.routes.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

const users = new Map();

connectDB();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("setup", (userId) => {
    users.set(userId, socket.id);
  });

  socket.on("private-message", async ({ senderId, receiverId, content }) => {
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    const receiverSocket = users.get(receiverId);
    const senderSocket = users.get(senderId);

    const payload = {
      message: message.content,
      senderId,
      receiverId,
      createdAt: message.createdAt,
    };

    // Send to sender
    if (senderSocket) io.to(senderSocket).emit("private-message", payload);

    // Send to receiver
    if (receiverSocket) io.to(receiverSocket).emit("private-message", payload);
  });

  socket.on("disconnect", () => {
    for (const [key, value] of users.entries()) {
      if (value === socket.id) users.delete(key);
    }
  });
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

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Deployment successful");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messageRoutes);

app.use(globalErrorHandler);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
