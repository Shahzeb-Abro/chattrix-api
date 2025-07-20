import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } });

  // Get last message for each user
  const usersWithLastMessage = await Promise.all(
    users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: req.user._id, receiver: user._id },
          { sender: user._id, receiver: req.user._id },
        ],
      }).sort({ createdAt: -1 });

      return {
        ...user.toObject(),
        lastMessage: lastMessage || null,
      };
    })
  );

  res.status(200).json({
    status: "success",
    data: usersWithLastMessage,
  });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  res.status(200).json({
    status: "success",
    data: user,
  });
});
