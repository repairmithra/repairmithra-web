import {
  LuAirVent,
  LuBrickWall,
  LuDroplets,
  LuFan,
  LuMonitorSmartphone,
  LuPaintRoller,
  LuRefrigerator,
  LuTv,
  LuWashingMachine,
  LuWrench,
  LuZap,
} from "react-icons/lu";

import acImage from "../assets/images/services/ac.jpg";
import electricalImage from "../assets/images/services/electrical.jpg";
import plumbingImage from "../assets/images/services/plumbing.jpg";
import mobileImage from "../assets/images/services/laptop-mobile.jpg";
import wallPaintingImage from "../assets/images/services/wall-painting.jpg";
import civilRepairImage from "../assets/images/services/civil-repair.jpg";
import fanImage from "../assets/images/services/fan.jpg";
import fridgeImage from "../assets/images/services/fridge.jpg";
import washingImage from "../assets/images/services/washing.jpg";
import tvImage from "../assets/images/services/tv.svg";

// ---------------------------------------------------------------------------
// Services — how the site shows them.
//
// WHAT COMES FROM WHERE
//   Backend (GET /api/services) — the source of truth for:
//       id, name, slug, visitFee, estimatedCostMin / estimatedCostMax
//     Prices live ONLY there, so what customers see on the site is always
//     what Razorpay charges. To change a price, edit the service in the
//     database (or backend/src/seedServices.js and re-seed).
//
//   This file — everything that is purely about presentation:
//       icon, tone, tagline, description, issues, keywords, aliases
//
// ADDING A SERVICE
//   1. Add it to the backend (seedServices.js → run the seed).
//   2. (Optional) add an entry below, using the same slug, to give it an
//      icon, tagline and issue list. Without one it still works and gets a
//      generic wrench icon.
//
// FIELDS
//   description – one-line blurb on cards
//   issues      – “Common <issueLabel> Issues We Fix” list on the detail page
//   aliases     – old URLs that should still work (redirected to the new slug)
//   tone        – Tailwind classes for the icon tile (background + icon colour)
//
// The ORDER of the entries below is the order services appear on the site.
// ---------------------------------------------------------------------------

const PRESENTATION = {
  "ac-repair": {
    icon: LuAirVent,
    image: acImage,
    tone: "bg-sky-50 text-sky-600",
    tagline: "Keep your home cool and comfortable.",
    description: "Cooling problems, gas refilling, leakage repair and installation.",
    issueLabel: "AC",
    issues: [
      "AC not cooling",
      "Water leakage",
      "Unusual noise",
      "Gas refilling",
      "Installation & uninstallation",
    ],
    keywords: ["air conditioner", "cooling", "split ac", "window ac", "gas"],
  },

  "fan-repair": {
    icon: LuFan,
    image: fanImage,
    tone: "bg-teal-50 text-teal-600",
    tagline: "Quiet, smooth-running fans all year round.",
    description: "Slow or noisy ceiling fans, regulators, capacitors and motors.",
    issueLabel: "Fan",
    issues: [
      "Fan running slow",
      "Humming or rattling noise",
      "Regulator not working",
      "Capacitor or motor replacement",
      "Wobbling or loose blades",
    ],
    keywords: ["ceiling fan", "table fan", "exhaust fan", "regulator", "capacitor"],
  },

  "tv-repair": {
    icon: LuTv,
    image: tvImage,
    tone: "bg-indigo-50 text-indigo-600",
    tagline: "Clear picture and sound, back on your screen.",
    description: "Display, sound, power and port problems on LED and smart TVs.",
    issueLabel: "TV",
    issues: [
      "No power or won't turn on",
      "Screen lines or flickering",
      "No sound or distorted audio",
      "HDMI and port problems",
      "Wall mounting",
    ],
    keywords: ["television", "led", "lcd", "smart tv", "display", "screen"],
  },

  "refrigerator-repair": {
    icon: LuRefrigerator,
    image: fridgeImage,
    tone: "bg-cyan-50 text-cyan-600",
    tagline: "Keep your food fresh and your fridge running well.",
    description: "Cooling faults, leakage, noise, gas refilling and door seal issues.",
    issueLabel: "Refrigerator",
    issues: [
      "Not cooling properly",
      "Water leakage",
      "Unusual noise",
      "Gas refilling",
      "Door seal or light issues",
    ],
    keywords: ["fridge", "freezer", "cooling", "double door"],
  },

  "washing-machine-repair": {
    icon: LuWashingMachine,
    image: washingImage,
    tone: "bg-blue-50 text-blue-600",
    tagline: "Get your laundry routine back on track.",
    description: "Spin, drain, leakage and power faults on top and front loaders.",
    issueLabel: "Washing Machine",
    issues: [
      "Not spinning or draining",
      "Water leakage",
      "Loud noise while washing",
      "Door lock issues",
      "Won't turn on",
    ],
    keywords: ["washer", "laundry", "front load", "top load", "dryer"],
  },

  "electrical-services": {
    icon: LuZap,
    image: electricalImage,
    tone: "bg-amber-50 text-amber-600",
    tagline: "Safe wiring, switches and fittings for your home.",
    description: "Switchboards, wiring, fan and light fitting, inverter setup.",
    issueLabel: "Electrical",
    issues: [
      "Switchboard and MCB repair",
      "Wiring and short circuits",
      "Fan and light fitting",
      "Inverter and stabilizer setup",
      "Power fluctuation issues",
    ],
    keywords: ["electrician", "wiring", "switch", "light", "inverter", "mcb"],
    aliases: ["electrical"],
  },

  "plumbing-services": {
    icon: LuDroplets,
    image: plumbingImage,
    tone: "bg-emerald-50 text-emerald-600",
    tagline: "Leaks fixed and fittings sorted, first time.",
    description: "Leakage repair, pipe fitting, drainage and bathroom plumbing.",
    issueLabel: "Plumbing",
    issues: [
      "Tap and pipe leakage",
      "Blocked drains",
      "Toilet and flush repair",
      "Water tank and motor issues",
      "Bathroom fittings",
    ],
    keywords: ["plumber", "leak", "tap", "pipe", "bathroom", "drain", "tank"],
    aliases: ["plumbing"],
  },

  "mobile-laptop-repair": {
    icon: LuMonitorSmartphone,
    image: mobileImage,
    tone: "bg-violet-50 text-violet-600",
    tagline: "Screens, batteries and software fixed fast.",
    description: "Screen, battery, charging and software repair for phones and laptops.",
    issueLabel: "Mobile & Laptop",
    issues: [
      "Cracked screen",
      "Battery draining fast",
      "Charging port problems",
      "Slow or hanging device",
      "Virus and software issues",
    ],
    keywords: ["phone", "mobile", "laptop", "computer", "macbook", "android", "iphone"],
    aliases: ["laptop-repair", "mobile-repair"],
  },

  "wall-painting": {
    icon: LuPaintRoller,
    image: wallPaintingImage,
    tone: "bg-rose-50 text-rose-600",
    tagline: "Fresh, clean walls for every room.",
    description: "Interior wall painting, repainting, touch-ups and putty work.",
    issueLabel: "Wall",
    issues: [
      "Interior wall painting",
      "Repainting and touch-ups",
      "Damp and peeling patches",
      "Putty and surface preparation",
      "Texture and accent walls",
    ],
    keywords: ["paint", "painter", "painting", "repaint", "putty", "colour", "color", "interior"],
  },

  "civil-repair": {
    icon: LuBrickWall,
    image: civilRepairImage,
    tone: "bg-orange-50 text-orange-600",
    tagline: "Strong, tidy repairs for cracks, plaster and masonry.",
    description: "Wall cracks, plaster repair, masonry and minor construction work.",
    issueLabel: "Civil",
    issues: [
      "Wall cracks and seepage",
      "Plaster and putty repair",
      "Masonry and cement work",
      "Tile and flooring repair",
      "Minor construction repairs",
    ],
    keywords: ["mason", "masonry", "crack", "plaster", "cement", "tiles", "construction", "civil"],
  },
};

const PRESENTATION_ORDER = Object.keys(PRESENTATION);

// Shown as the tick-list on every service detail page.
export const serviceBenefits = [
  "Verified & experienced technicians",
  "Doorstep service",
  "Original parts (if required)",
  "Transparent process",
  "Support via app/website",
];

// ---------------------------------------------------------------------------
// Merge one service from the API with its presentation details.
// The shape returned here is what every page uses.
// ---------------------------------------------------------------------------
export const decorateService = (apiService) => {
  const look = PRESENTATION[apiService.slug] ?? {};

  return {
    id: apiService._id, // needed to create a booking

    slug: apiService.slug,
    title: apiService.name,
    description: look.description ?? apiService.description,

    // Money — always from the backend
    visitFee: apiService.visitFee,
    estimateMin: apiService.estimatedCostMin,
    estimateMax: apiService.estimatedCostMax,

    // Presentation — from this file, with safe defaults for new services
    icon: look.icon ?? LuWrench,
    image: look.image ?? null,
    tone: look.tone ?? "bg-slate-100 text-slate-600",
    tagline: look.tagline ?? apiService.description,
    issueLabel: look.issueLabel ?? apiService.name,
    issues: look.issues ?? [],
    keywords: look.keywords ?? [],
    aliases: look.aliases ?? [],
  };
};

// Featured order first (as listed above), anything else alphabetically after.
export const sortServices = (services) => {
  const rank = (service) => {
    const index = PRESENTATION_ORDER.indexOf(service.slug);
    return index === -1 ? PRESENTATION_ORDER.length : index;
  };

  return [...services].sort(
    (a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title)
  );
};

// Finds a service by its slug — or by an old slug listed under `aliases`.
export const findService = (services, slug) =>
  services.find((s) => s.slug === slug) ||
  services.find((s) => s.aliases.includes(slug));

// Case-insensitive search across title, tagline, issues and keywords.
export const searchServices = (services, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return services;

  return services.filter((s) =>
    [s.title, s.tagline, s.description, ...s.issues, ...s.keywords]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
};