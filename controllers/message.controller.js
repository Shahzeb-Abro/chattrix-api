import mongoose from "mongoose";
import Message from "../models/message.model.js";
import catchAsync from "../utils/catchAsync.js";

export const getMessages = catchAsync(async (req, res, next) => {
  const { id: receiverIdParam } = req.params;

  let receiverId, senderId;
  try {
    receiverId = new mongoose.Types.ObjectId(receiverIdParam);
    senderId = new mongoose.Types.ObjectId(req.user._id);
  } catch (error) {
    console.error("Invalid ObjectId:", error);
    return res.status(400).json({ status: "fail", message: "Invalid user ID" });
  }

  const messages = await Message.find({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "name imgUrl")
    .populate("receiver", "name imgUrl");

  res.status(200).json({
    status: "success",
    messages,
  });
});

export const deleteMessage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await Message.findByIdAndDelete(id);
  res.status(200).json({
    status: "success",
  });
});

export const markAsRead = catchAsync(async (req, res, next) => {
  const receiverId = new mongoose.Types.ObjectId(req.user._id);
  const senderId = new mongoose.Types.ObjectId(req.params.id);

  await Message.updateMany(
    { receiver: receiverId, sender: senderId },
    { $set: { isRead: true } }
  );
  res.status(200).json({
    status: "success",
  });
});
