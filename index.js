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
import userRoutes from "./routes/user.routes.js";
import User from "./models/user.model.js";

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
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

  socket.on("setup", async (userId) => {
    users.set(userId, socket.id);
    socket.userId = userId;
    console.log(`✅ User ${userId} mapped to socket ${socket.id}`);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    socket.broadcast.emit("user-online", { userId });
  });

  socket.on("typing", ({ receiverId }) => {
    console.log("typing", receiverId);
    const receiverSocket = users.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { senderId: socket.userId });
    }
  });

  socket.on("stop-typing", ({ receiverId }) => {
    const receiverSocket = users.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("stop-typing", { senderId: socket.userId });
    }
  });

  socket.on("private-message", async ({ senderId, receiverId, content }) => {
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      deliveredAt: new Date(),
      isRead: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name imgUrl")
      .populate("receiver", "name imgUrl");

    const receiverSocket = users.get(receiverId);
    const senderSocket = users.get(senderId);

    // Send to sender
    if (senderSocket)
      io.to(senderSocket).emit("private-message", populatedMessage);

    // Send to receiver
    if (receiverSocket)
      io.to(receiverSocket).emit("private-message", populatedMessage);
  });

  socket.on("mark-as-read", async ({ senderId, receiverId }) => {
    console.log("mark-as-read", senderId, receiverId);
    await Message.updateMany(
      { receiver: receiverId, sender: senderId, isRead: false },
      { $set: { isRead: true } }
    );
    const senderSocket = users.get(senderId);
    if (senderSocket) io.to(senderSocket).emit("mark-as-read", { receiverId });
  });

  socket.on("disconnect", async () => {
    for (const [key, value] of users.entries()) {
      if (value === socket.id) users.delete(key);
    }
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      lastSeen: new Date(),
    });
    socket.broadcast.emit("user-offline", { userId: socket.userId });
  });
});

app.use(passport.initialize());

app.use(cookieParser());

app.set("view engine", "pug");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Deployment successful");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/users", userRoutes);

app.use(globalErrorHandler);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
