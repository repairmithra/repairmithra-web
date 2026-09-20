import {
  LuAirVent,
  LuFan,
  LuTv,
  LuRefrigerator,
  LuWashingMachine,
  LuZap,
  LuDroplets,
  LuMonitorSmartphone,
} from "react-icons/lu";

// ---------------------------------------------------------------------------
// Single source of truth for every service on the site.
//
// Add a service by adding ONE object to the array below. It then shows up on:
//   • the Home page “Popular Services”
//   • the /services page grid (and its search)
//   • its own detail page      /services/:slug
//   • the whole booking flow   /services/:slug/book → /payment → confirmation
//
// visitFee      – amount (₹) the customer pays online to book the visit
// estimateMin/Max – rough repair cost range, paid to the technician after diagnosis
// issues        – “Common <issueLabel> Issues We Fix” list on the detail page
// aliases       – old URLs that should still work (redirected to the new slug)
// tone          – Tailwind classes for the icon tile (background + icon colour)
// ---------------------------------------------------------------------------

export const services = [
  {
    slug: "ac-repair",
    title: "AC Repair",
    icon: LuAirVent,
    tone: "bg-sky-50 text-sky-600",
    tagline: "Keep your home cool and comfortable.",
    description: "Cooling problems, gas refilling, leakage repair and installation.",
    visitFee: 200,
    estimateMin: 500,
    estimateMax: 2000,
    issueLabel: "AC",
    issues: [
      "AC not cooling",
      "Water leakage",
      "Unusual noise",
      "Gas refilling",
      "Installation & uninstallation",
    ],
    keywords: ["air conditioner", "cooling", "split ac", "window ac", "gas"],
    aliases: [],
  },
  {
    slug: "fan-repair",
    title: "Fan Repair",
    icon: LuFan,
    tone: "bg-teal-50 text-teal-600",
    tagline: "Quiet, smooth-running fans all year round.",
    description: "Slow or noisy ceiling fans, regulators, capacitors and motors.",
    visitFee: 150,
    estimateMin: 200,
    estimateMax: 1200,
    issueLabel: "Fan",
    issues: [
      "Fan running slow",
      "Humming or rattling noise",
      "Regulator not working",
      "Capacitor or motor replacement",
      "Wobbling or loose blades",
    ],
    keywords: ["ceiling fan", "table fan", "exhaust fan", "regulator", "capacitor"],
    aliases: [],
  },
  {
    slug: "tv-repair",
    title: "TV Repair",
    icon: LuTv,
    tone: "bg-indigo-50 text-indigo-600",
    tagline: "Clear picture and sound, back on your screen.",
    description: "Display, sound, power and port problems on LED and smart TVs.",
    visitFee: 250,
    estimateMin: 500,
    estimateMax: 4000,
    issueLabel: "TV",
    issues: [
      "No power or won't turn on",
      "Screen lines or flickering",
      "No sound or distorted audio",
      "HDMI and port problems",
      "Wall mounting",
    ],
    keywords: ["television", "led", "lcd", "smart tv", "display", "screen"],
    aliases: [],
  },
  {
    slug: "refrigerator-repair",
    title: "Refrigerator Repair",
    icon: LuRefrigerator,
    tone: "bg-cyan-50 text-cyan-600",
    tagline: "Keep your food fresh and your fridge running well.",
    description: "Cooling faults, leakage, noise, gas refilling and door seal issues.",
    visitFee: 250,
    estimateMin: 600,
    estimateMax: 4500,
    issueLabel: "Refrigerator",
    issues: [
      "Not cooling properly",
      "Water leakage",
      "Unusual noise",
      "Gas refilling",
      "Door seal or light issues",
    ],
    keywords: ["fridge", "freezer", "cooling", "double door"],
    aliases: [],
  },
  {
    slug: "washing-machine-repair",
    title: "Washing Machine Repair",
    icon: LuWashingMachine,
    tone: "bg-blue-50 text-blue-600",
    tagline: "Get your laundry routine back on track.",
    description: "Spin, drain, leakage and power faults on top and front loaders.",
    visitFee: 250,
    estimateMin: 500,
    estimateMax: 3500,
    issueLabel: "Washing Machine",
    issues: [
      "Not spinning or draining",
      "Water leakage",
      "Loud noise while washing",
      "Door lock issues",
      "Won't turn on",
    ],
    keywords: ["washer", "laundry", "front load", "top load", "dryer"],
    aliases: [],
  },
  {
    slug: "electrical-services",
    title: "Electrical Services",
    icon: LuZap,
    tone: "bg-amber-50 text-amber-600",
    tagline: "Safe wiring, switches and fittings for your home.",
    description: "Switchboards, wiring, fan and light fitting, inverter setup.",
    visitFee: 150,
    estimateMin: 200,
    estimateMax: 2000,
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
  {
    slug: "plumbing-services",
    title: "Plumbing Services",
    icon: LuDroplets,
    tone: "bg-emerald-50 text-emerald-600",
    tagline: "Leaks fixed and fittings sorted, first time.",
    description: "Leakage repair, pipe fitting, drainage and bathroom plumbing.",
    visitFee: 150,
    estimateMin: 200,
    estimateMax: 2500,
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
  {
    slug: "mobile-laptop-repair",
    title: "Mobile & Laptop Repair",
    icon: LuMonitorSmartphone,
    tone: "bg-violet-50 text-violet-600",
    tagline: "Screens, batteries and software fixed fast.",
    description: "Screen, battery, charging and software repair for phones and laptops.",
    visitFee: 200,
    estimateMin: 300,
    estimateMax: 5000,
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
];

// Shown as the tick-list on every service detail page.
export const serviceBenefits = [
  "Verified & experienced technicians",
  "Doorstep service",
  "Original parts (if required)",
  "Transparent process",
  "Support via app/website",
];

// Finds a service by its slug — or by an old slug listed under `aliases`.
export const getServiceBySlug = (slug) =>
  services.find((s) => s.slug === slug) ||
  services.find((s) => s.aliases.includes(slug));

// Case-insensitive search across title, tagline, issues and keywords.
export const searchServices = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return services;

  return services.filter((s) =>
    [s.title, s.tagline, s.description, ...s.issues, ...s.keywords]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
};