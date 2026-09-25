/**
 * Everything client-specific lives here + menu.ts (+ story copy in components/film/Home.tsx).
 * To re-skin for a new restaurant, edit these and swap /public assets.
 */
export const site = {
  name: "BiteME",
  tagline: "One Table. Six Kitchens.",
  description:
    "A Dhaka restaurant that travels — Deshi, Japanese, Indian, Italian, Chinese and American burgers under one roof. Order online, dine in, or book a table.",
  city: "Dhaka",
  address: "House 42, Road 11, Banani, Dhaka 1213",
  phone: "+880 1918-331878",
  whatsapp: "8801918331878",
  email: "hello@biteme.bd",
  deliveryAreas: ["Banani", "Gulshan 1 & 2", "Baridhara", "Niketan", "Mohakhali DOHS"],
  /** time slots offered on the reservation page */
  reservationSlots: ["12:30", "13:30", "14:30", "18:00", "19:00", "20:00", "21:00", "22:00"],
  /**
   * Company details printed in the footer and the legal pages. These are PLACEHOLDERS —
   * each restaurant must replace them with its real registered details before launch.
   */
  legal: {
    companyName: "BiteME Hospitality Ltd.",
    tradeLicense: "TRAD/DNCC/000000/2026",
    vatBin: "000000000-0000",
    registeredAddress: "House 42, Road 11, Banani, Dhaka 1213, Bangladesh",
    grievanceEmail: "care@biteme.bd",
    /** when the legal pages were last reviewed */
    updated: "1 September 2026",
  },
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
