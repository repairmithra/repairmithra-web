import mongoose from "mongoose";

const technicianSchema = new mongoose.Schema(
  {
    // Technician's user account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Services this technician can handle
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    // Technician's current/service location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },

      // IMPORTANT:
      // [longitude, latitude]
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    // Maximum distance technician is willing to travel
    serviceRadiusKm: {
      type: Number,
      default: 20,
      min: 1,
      max: 20,
    },

    // Whether technician can receive bookings
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Whether technician is currently available
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB geospatial index
technicianSchema.index({
  location: "2dsphere",
});

const Technician = mongoose.model(
  "Technician",
  technicianSchema
);

export default Technician;