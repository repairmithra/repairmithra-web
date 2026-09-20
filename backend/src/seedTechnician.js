import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcrypt";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Service from "./models/Service.js";
import Technician from "./models/Technician.js";

const seedTechnician = async () => {
  try {
    console.log("🌱 Starting technician seed...");

    await connectDB();

    // Find required services
    const acService = await Service.findOne({
      slug: "ac-repair",
      isActive: true,
    });

    const wallPaintingService = await Service.findOne({
      slug: "wall-painting",
      isActive: true,
    });

    const civilRepairService = await Service.findOne({
      slug: "civil-repair",
      isActive: true,
    });

    // Check required services
    if (!acService || !wallPaintingService || !civilRepairService) {
      throw new Error(
        "Required services not found. Run seedServices.js first."
      );
    }

    console.log("✅ Required services found");

    // Check whether test technician already exists
    let technicianUser = await User.findOne({
      email: "technician@repairmithra.com",
    });

    // Create technician user if it doesn't exist
    if (!technicianUser) {
      const hashedPassword = await bcrypt.hash(
        "Technician@123",
        12
      );

      technicianUser = await User.create({
        fullName: "Test Technician",
        email: "technician@repairmithra.com",
        phone: "9876543210",
        address: "Hyderabad",
        pincode: "500001",
        password: hashedPassword,
        role: "technician",
        isVerified: true,
      });

      console.log("👨‍🔧 Test technician user created");
    } else {
      console.log("👨‍🔧 Test technician user already exists");
    }

    // Remove old technician profile for clean testing
    await Technician.deleteOne({
      user: technicianUser._id,
    });

    // Create technician profile
    const technician = await Technician.create({
      user: technicianUser._id,

      services: [
        acService._id,
        wallPaintingService._id,
        civilRepairService._id,
      ],

      location: {
        type: "Point",
        coordinates: [
          78.486671,
          17.385044,
        ],
      },

      serviceRadiusKm: 20,

      isActive: true,

      isAvailable: true,
    });

    console.log("✅ Technician profile created");

    console.log("Technician:");
    console.log("   Name: Test Technician");
    console.log("   Email: technician@repairmithra.com");
    console.log(
      "   Services: AC Repair, Wall Painting, Civil Repair"
    );
    console.log("   Radius: 20 km");
    console.log(
      "   Location: 17.385044, 78.486671"
    );

    await mongoose.connection.close();

    console.log("🔌 MongoDB connection closed");

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Technician seed failed:",
      error
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedTechnician();