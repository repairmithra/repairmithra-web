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

    // ----------------------------------------------------------------
    // Partner profile details (collected at registration / editable later)
    // ----------------------------------------------------------------

    // Free-text service area shown on the partner profile (e.g. "Jangaon,
    // Telangana"). The actual matching radius uses `location` + `serviceRadiusKm`.
    city: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
      max: 60,
    },

    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // Weekly schedule: { mon: { open, start: "09:00", end: "18:00" }, ... sun }
    workingHours: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    // Payout details. Hidden from queries by default (select: false) so they
    // never leak through other endpoints; the partner profile routes opt in.
    bankDetails: {
      type: {
        accountHolder: { type: String, trim: true, maxlength: 80, default: "" },
        accountNumber: { type: String, trim: true, maxlength: 18, default: "" },
        ifsc: { type: String, trim: true, uppercase: true, maxlength: 11, default: "" },
        bankName: { type: String, trim: true, maxlength: 80, default: "" },
        upiId: { type: String, trim: true, maxlength: 80, default: "" },
      },
      default: undefined,
      select: false,
    },

    // KYC documents (ID proof, photo, certificate). `status` is only ever
    // changed by the server / an admin — never by the partner.
    documents: {
      type: [
        {
          type: { type: String, enum: ["idProof", "photo", "certificate"], required: true },
          name: { type: String, trim: true, maxlength: 120, default: "" },
          data: { type: String, default: "" }, // base64 data URL
          status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
          },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },

    ratingSum: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
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