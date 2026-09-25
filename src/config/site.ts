/**
 * Everything client-specific lives here + menu.ts + chapters.ts.
 * To re-skin for a new restaurant, edit these three files and swap /public assets.
 */
export const site = {
  name: "BiteME",
  tagline: "One Table. Six Kitchens.",
  description:
    "A Dhaka restaurant that travels — Deshi, Japanese, Indian, Italian, Chinese and American burgers under one roof. Order online, dine in, or book a table.",
  city: "Dhaka",
  address: "House 42, Road 11, Banani, Dhaka 1213",
  phone: "+880 1700-000000",
  whatsapp: "8801700000000",
  hours: [
    { days: "Sat – Thu", time: "12:00 PM – 11:30 PM" },
    { days: "Friday", time: "2:30 PM – 12:00 AM" },
  ],
  delivery: {
    fee: 60,
    freeAbove: 1500,
    vatRate: 0.05,
    serviceRate: 0.0, // dine-in service charge can be enabled here
  },
  payments: ["bkash", "nagad", "card", "cod"] as const,
  socials: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
  },
};

export type PaymentMethod = (typeof site.payments)[number];
