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

      // Count unread messages sent from this user to the logged-in user
      const unreadCount = await Message.countDocuments({
        sender: user._id,
        receiver: req.user._id,
        isRead: false,
      });

      let lastMessageWithSender = null;
      if (lastMessage) {
        lastMessageWithSender = {
          ...lastMessage.toObject(),
          sender:
            String(lastMessage.sender) === String(req.user._id)
              ? "You"
              : user.name,
        };
      }

      return {
        ...user.toObject(),
        lastMessage: lastMessageWithSender,
        unreadCount, // Add unread count here
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
