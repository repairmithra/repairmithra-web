import "dotenv/config";

import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Service from "./models/Service.js";

const services = [
  {
    name: "AC Repair",
    slug: "ac-repair",
    description:
      "Professional AC repair, servicing, installation and maintenance.",
    visitFee: 200,
    estimatedCostMin: 500,
    estimatedCostMax: 2000,
  },

  {
    name: "Fan Repair",
    slug: "fan-repair",
    description:
      "Ceiling fan, exhaust fan and other fan repair services.",
    visitFee: 100,
    estimatedCostMin: 300,
    estimatedCostMax: 1500,
  },

  {
    name: "TV Repair",
    slug: "tv-repair",
    description:
      "Professional LED, LCD and smart TV inspection and repair.",
    visitFee: 200,
    estimatedCostMin: 500,
    estimatedCostMax: 5000,
  },

  {
    name: "Refrigerator Repair",
    slug: "refrigerator-repair",
    description:
      "Refrigerator diagnosis, servicing and repair by technicians.",
    visitFee: 200,
    estimatedCostMin: 500,
    estimatedCostMax: 4000,
  },
  {
    name: "Wall Painting",
    slug: "wall-painting",
    description:
      "Professional wall painting, repainting, touch-up and interior wall painting services.",
    visitFee: 200,
    estimatedCostMin: 1500,
    estimatedCostMax: 25000,
  },
  {
    name: "Civil Repair",
    slug: "civil-repair",
    description:
      "Civil repair services including wall cracks, plaster repair, masonry, cement work and minor construction repairs.",
    visitFee: 200,
    estimatedCostMin: 500,
    estimatedCostMax: 50000,
  },
  {
    name: "Washing Machine Repair",
    slug: "washing-machine-repair",
    description:
      "Washing machine inspection, servicing and repair.",
    visitFee: 200,
    estimatedCostMin: 500,
    estimatedCostMax: 4000,
  },

  {
    name: "Electrical Services",
    slug: "electrical-services",
    description:
      "Electrical repair, installation and maintenance services.",
    visitFee: 100,
    estimatedCostMin: 300,
    estimatedCostMax: 3000,
  },

  {
    name: "Plumbing Services",
    slug: "plumbing-services",
    description:
      "Professional plumbing repair and maintenance services.",
    visitFee: 100,
    estimatedCostMin: 300,
    estimatedCostMax: 3000,
  },

  {
    name: "Mobile & Laptop Repair",
    slug: "mobile-laptop-repair",
    description:
      "Mobile phone and laptop diagnosis, repair and maintenance.",
    visitFee: 100,
    estimatedCostMin: 300,
    estimatedCostMax: 10000,
  },
];

const seedServices = async () => {
  try {
    console.log("🌱 Starting service seed...");

    await connectDB();

    console.log("📦 Clearing existing services...");

    await Service.deleteMany({});

    console.log("📦 Adding services...");

    const createdServices =
      await Service.insertMany(services);

    console.log(
      `✅ ${createdServices.length} services added successfully`
    );

    createdServices.forEach((service) => {
      console.log(
        `   - ${service.name} | Visit Fee: ₹${service.visitFee}`
      );
    });

    await mongoose.connection.close();

    console.log("🔌 MongoDB connection closed");

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Service seed failed:",
      error
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedServices();