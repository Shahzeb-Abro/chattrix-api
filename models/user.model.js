import mongoose from "mongoose";
import pkg from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

const { isEmail } = pkg;

const userSchema = new mongoose.Schema(
  {
    imgUrl: {
      type: String,
    },
    googleId: {
      type: String,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name cannot be less than 3 characters"],
      maxlength: [50, "Name cannot be greater than 50 characters"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [8, "Password cannot be shorter than 8 characters"],
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiresIn: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.arePasswordsEqual = async function (
  candidatePassword,
  hashedPassword
) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangeTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < passwordChangeTime;
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordTokenExpiresIn = Date.now() + 10 * 60 * 1000;

  return token;
};

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
