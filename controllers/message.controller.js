import Message from "../models/message.model.js";
import catchAsync from "../utils/catchAsync.js";

export const getMessages = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const messages = await Message.find({
    $or: [{ sender: id }, { receiver: id }],
  }).sort({ createdAt: 1 });
  res.status(200).json({
    status: "success",
    messages,
  });
});
