// ======================================================
// Demo data for the Partner Workflow, so the dashboard, job list and
// earnings screens have something to show right after setup.
//
// Run with: node src/seedPartnerDemo.js   (after seedServices + seedTechnician)
// ======================================================
import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcrypt";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Service from "./models/Service.js";
import Technician from "./models/Technician.js";
import Booking from "./models/Booking.js";

const TECHNICIAN_LOCATION = [78.486671, 17.385044]; // [lng, lat] — near seedTechnician.js

const randomBookingCode = () =>
  `RM-DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seedPartnerDemo = async () => {
  try {
    console.log("🌱 Starting partner demo seed...");

    await connectDB();

    const acService = await Service.findOne({ slug: "ac-repair", isActive: true });
    const electricalService = await Service.findOne({
      slug: "electrical-services",
      isActive: true,
    });
    const plumbingService = await Service.findOne({
      slug: "plumbing-services",
      isActive: true,
    });
    const tvService = await Service.findOne({ slug: "tv-repair", isActive: true });

    if (!acService || !electricalService || !plumbingService || !tvService) {
      throw new Error("Required services not found. Run seedServices.js first.");
    }

    let technicianUser = await User.findOne({ email: "technician@repairmithra.com" });

    if (!technicianUser) {
      const hashedPassword = await bcrypt.hash("Technician@123", 12);

      technicianUser = await User.create({
        fullName: "Aravind Kumar",
        email: "technician@repairmithra.com",
        phone: "9876543210",
        address: "Jangaon, Telangana",
        pincode: "506167",
        password: hashedPassword,
        role: "technician",
        isVerified: true,
      });

      console.log("👨‍🔧 Demo partner user created (technician@repairmithra.com / Technician@123)");
    } else {
      console.log("👨‍🔧 Demo partner user already exists");
    }

    let technicianProfile = await Technician.findOne({ user: technicianUser._id });

    if (!technicianProfile) {
      technicianProfile = await Technician.create({
        user: technicianUser._id,
        services: [acService._id, electricalService._id, plumbingService._id, tvService._id],
        location: { type: "Point", coordinates: TECHNICIAN_LOCATION },
        serviceRadiusKm: 20,
        isActive: true,
        isAvailable: true,
        city: "Jangaon, Telangana",
        experienceYears: 5,
        ratingSum: 141,
        ratingCount: 30,
      });
      console.log("✅ Demo technician profile created");
    } else {
      technicianProfile.services = [
        acService._id,
        electricalService._id,
        plumbingService._id,
        tvService._id,
      ];
      technicianProfile.city = "Jangaon, Telangana";
      technicianProfile.experienceYears = 5;
      technicianProfile.ratingSum = 141;
      technicianProfile.ratingCount = 30;
      await technicianProfile.save();
      console.log("✅ Demo technician profile updated");
    }

    // A demo customer, so bookings have someone to point to
    let customer = await User.findOne({ email: "demo.customer@repairmithra.com" });

    if (!customer) {
      const hashedPassword = await bcrypt.hash("Customer@123", 12);

      customer = await User.create({
        fullName: "Ravi Kumar",
        email: "demo.customer@repairmithra.com",
        phone: "9876500000",
        address: "12-3-45, Main Road",
        pincode: "506167",
        password: hashedPassword,
        role: "customer",
        isVerified: true,
      });
      console.log("🙋 Demo customer created");
    }

    // Clear any previous demo bookings so this script is safe to re-run
    await Booking.deleteMany({ technician: technicianUser._id, bookingCode: /^RM-DEMO-/ });

    const makeBooking = (overrides) =>
      Booking.create({
        bookingCode: randomBookingCode(),
        customer: customer._id,
        service: acService._id,
        address: customer.address,
        city: "Jangaon",
        pincode: customer.pincode,
        notes: "AC not cooling. Need inspection.",
        location: { type: "Point", coordinates: TECHNICIAN_LOCATION },
        bookingDate: new Date(),
        timeSlot: "02:00 PM - 06:00 PM",
        technician: technicianUser._id,
        paymentStatus: "paid",
        ...overrides,
      });

    // 1 new request awaiting accept/reject
    await makeBooking({
      status: "confirmed",
      technicianResponseStatus: "pending",
      service: acService._id,
      notes: "AC not cooling. Need inspection.",
    });

    // 1 accepted, not yet started
    await makeBooking({
      status: "technician_assigned",
      technicianResponseStatus: "accepted",
      service: electricalService._id,
      notes: "Frequent power trips in the hall.",
    });

    // 1 active (in progress)
    await makeBooking({
      status: "repair_in_progress",
      technicianResponseStatus: "accepted",
      service: plumbingService._id,
      finalRepairAmount: 600,
      notes: "Leaking kitchen tap.",
    });

    // Completed jobs (for earnings history). `updatedAt` is backdated with a
    // raw update afterwards, since Mongoose's timestamps plugin otherwise
    // always forces it to "now" on create/save.
    const completedJobs = [
      { service: acService._id, finalRepairAmount: 2000, daysBack: 12 },
      { service: electricalService._id, finalRepairAmount: 1200, daysBack: 14 },
      { service: plumbingService._id, finalRepairAmount: 800, daysBack: 17 },
      { service: tvService._id, finalRepairAmount: 1000, daysBack: 19 },
    ];

    for (const job of completedJobs) {
      const booking = await makeBooking({
        status: "completed",
        technicianResponseStatus: "accepted",
        service: job.service,
        finalRepairAmount: job.finalRepairAmount,
        repairPaymentStatus: "paid_to_technician",
      });

      await Booking.updateOne(
        { _id: booking._id },
        { $set: { updatedAt: daysAgo(job.daysBack) } },
        { timestamps: false }
      );
    }

    console.log("✅ Demo bookings created");
    console.log("\nLogin as this partner with:");
    console.log("   Mobile/Email: technician@repairmithra.com");
    console.log("   Password:     Technician@123\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Partner demo seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedPartnerDemo();