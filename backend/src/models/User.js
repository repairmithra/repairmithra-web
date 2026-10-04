import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[6-9][0-9]{9}$/,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 250,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{6}$/,
    },

    // Extra saved locations (work, a relative's place, etc.) shown on the
    // profile page. The address/pincode fields above stay as the account's
    // primary "Home" address.
    addresses: [
      {
        label: {
          type: String,
          required: true,
          trim: true,
          maxlength: 30,
        },
        address: {
          type: String,
          required: true,
          trim: true,
          minlength: 5,
          maxlength: 250,
        },
        pincode: {
          type: String,
          required: true,
          trim: true,
          match: /^[0-9]{6}$/,
        },
        latitude: Number,
        longitude: Number,
      },
      { timestamps: true },
    ],

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ["customer", "technician", "admin"],
      default: "customer",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;