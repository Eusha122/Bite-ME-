import { site } from "./site";
import { formatBDT } from "./menu";

/*
 * Template legal copy for a Bangladeshi restaurant with online ordering. It is written from
 * the settings in site.ts, but it is a starting point, not legal advice: every restaurant
 * should have it reviewed by its own lawyer before launch.
 */

export type LegalSection = { heading: string; body: string[] };
export type LegalPage = { slug: string; title: string; summary: string; sections: LegalSection[] };

const co = site.legal.companyName;
const fee = formatBDT(site.delivery.fee);
const free = formatBDT(site.delivery.freeAbove);
const vat = `${Math.round(site.delivery.vatRate * 100)}%`;

export const legalPages: LegalPage[] = [
  {
    slug: "terms",
    title: "Terms of use",
    summary: `The rules for ordering from ${site.name}, in plain English.`,
    sections: [
      {
        heading: "Who we are",
        body: [`${site.name} is operated by ${co}, registered at ${site.legal.registeredAddress}. Trade licence ${site.legal.tradeLicense}. VAT registration (BIN) ${site.legal.vatBin}.`, "By ordering or booking through this website you agree to these terms."],
      },
      {
        heading: "Ordering",
        body: [
          "An order is a request to buy. It becomes a contract when the kitchen accepts it — you will see that on your tracking page. We may decline an order, for example if a dish has run out, the address is outside our delivery area, or we can't reach you.",
          "Menu items, descriptions and photographs are as accurate as we can make them, but real dishes vary slightly. If something on your tray becomes unavailable, we will tell you before we cook it.",
        ],
      },
      {
        heading: "Prices and VAT",
        body: [`All prices are in Bangladeshi Taka (BDT). VAT of ${vat} is added at checkout and shown before you pay. Delivery is ${fee}, and free on orders over ${free}. The total you see at checkout is the total you pay.`],
      },
      {
        heading: "Payment",
        body: ["You can pay by bKash, Nagad, Visa or other cards, or cash on delivery or at your table. Card and wallet payments are processed by our payment partner — we never see or store your card number or wallet PIN.", "For cash orders, please have the right change ready; our riders carry limited change."],
      },
      {
        heading: "Delivery and pickup",
        body: [`We deliver to ${site.deliveryAreas.join(", ")}. Delivery times (usually 30–45 minutes) are estimates, not guarantees, and can be longer in bad weather or heavy traffic. Please be reachable on the phone number you give us; if we can't reach you after several attempts, the order may be cancelled.`, "Pickup orders are ready in about 20 minutes. Please collect them promptly so the food is at its best."],
      },
      {
        heading: "Reservations",
        body: ["A reservation request is confirmed only when we reply by SMS. We hold a table for 15 minutes after the booked time. Please call us to change or cancel."],
      },
      {
        heading: "Your account",
        body: ["The login on this website is optional and only saves your name and phone number for faster checkout. Keep your device secure; you are responsible for orders placed from it."],
      },
      {
        heading: "Using the website",
        body: ["Please don't misuse the site: no scraping, automated ordering, false orders, or attempts to interfere with our systems. We may block access to anyone who does.", `All photographs, video, text, the ${site.name} name and logo belong to ${co} or its licensors and may not be copied without permission.`],
      },
      {
        heading: "Our responsibility",
        body: ["Nothing in these terms limits your rights under the Consumer Rights Protection Act 2009 or any other law that can't be excluded. Beyond that, our liability for any order is limited to the price you paid for it."],
      },
      {
        heading: "Changes and governing law",
        body: ["We may update these terms; the version on this page is the one that applies, and the date at the top shows when it last changed.", "These terms are governed by the laws of Bangladesh, and the courts of Dhaka have jurisdiction."],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What we collect, why, and the choices you have.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you order: your name, mobile number, delivery address (for delivery orders), table number (for dine-in), what you ordered, any notes you type, and how you paid.",
          "When you book a table: your name, mobile number, date, time, party size and any note.",
          "When you log in: the name and mobile number you enter. In this version of the website that information stays in your own browser.",
          "Automatically: basic technical data such as browser type and pages visited, used to keep the site working and fast.",
        ],
      },
      {
        heading: "Why we use it",
        body: ["To cook and deliver your order, contact you about it, take payment, confirm bookings, give you support, keep records the law requires (such as tax records), prevent fraud, and improve the menu and service."],
      },
      {
        heading: "Who sees it",
        body: ["Our kitchen and service team see what they need to prepare and deliver your order. Our delivery riders see your name, address and phone number for the delivery only. Payment providers (bKash, Nagad, card networks) handle your payment details. We do not sell your personal information.", "We may share information when the law requires it."],
      },
      {
        heading: "How long we keep it",
        body: ["Order records are kept for as long as tax and accounting rules require. Reservation details are deleted after 12 months. You can ask us to delete your account information at any time."],
      },
      {
        heading: "Your choices",
        body: [`You can ask to see, correct or delete the personal information we hold about you by emailing ${site.legal.grievanceEmail}. You can log out at any time, which clears your saved details from that device. We only send you messages about your own orders and bookings — no marketing without asking first.`],
      },
      {
        heading: "Cookies and local storage",
        body: ["We use your browser's storage to remember the items in your cart, your login (if you use it), and small preferences. We use no advertising cookies. If you clear your browser data, your cart and login are cleared too."],
      },
      {
        heading: "Security",
        body: ["We protect our systems with access controls and encrypted connections. No system is perfectly secure, so please tell us straight away if you suspect misuse of your information."],
      },
      {
        heading: "Contact",
        body: [`${co}, ${site.legal.registeredAddress}. Email ${site.legal.grievanceEmail} or call ${site.phone}.`],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Refunds and cancellations",
    summary: "What happens when you change your mind, or we get it wrong.",
    sections: [
      {
        heading: "Cancelling an order",
        body: [`Call us on ${site.phone} as soon as you can. You can cancel for free until the kitchen has started cooking (your tracking page will say "On the fire"). After that the food is already made, so we can't cancel it.`],
      },
      {
        heading: "If something is wrong",
        body: ["If your order arrives late, incomplete, damaged, cold, or not what you ordered, tell us within 2 hours — a photo on WhatsApp with your order code is the fastest way. We will remake the item, credit you, or refund you, whichever you prefer where possible."],
      },
      {
        heading: "How refunds are paid",
        body: ["Refunds go back to the way you paid: bKash or Nagad refunds usually arrive the same day; card refunds take 5–10 working days depending on your bank. For cash orders we refund by bKash or Nagad, or credit your next order."],
      },
      {
        heading: "What we can't refund",
        body: ["We can't refund food that was made correctly and delivered on time simply because you changed your mind, an order cancelled because we couldn't reach you at the address given, or delivery fees once the rider has left."],
      },
      {
        heading: "Reservations",
        body: ["Cancel a reservation by phone, ideally a few hours ahead. There is no charge for a normal reservation. For large group bookings with a set menu, we will agree cancellation terms with you when we confirm."],
      },
    ],
  },
  {
    slug: "allergens",
    title: "Allergens and food safety",
    summary: "Please read this if you or someone you feed has an allergy.",
    sections: [
      {
        heading: "Tell us before you order",
        body: ["Write any allergy in the note at checkout, or tell us when you book. Every allergy note is read out on the kitchen line and printed on the kitchen ticket."],
      },
      {
        heading: "What our kitchens use",
        body: ["Across our six kitchens we use peanuts and tree nuts, milk and dairy, eggs, gluten (wheat, soy sauce, noodles, breadcrumbs), soy, sesame, fish, shellfish and mustard. Many dishes contain more than one of these."],
      },
      {
        heading: "Cross-contact",
        body: ["Our dishes are cooked in shared kitchens, on shared woks, tandoors, grills and fryers. We take care, but we cannot guarantee any dish is completely free of an allergen. If your allergy is severe, please speak to us by phone before ordering."],
      },
      {
        heading: "Vegetarian and spicy",
        body: ["Dishes marked vegetarian contain no meat or fish, but may be cooked in the same oil or on the same surfaces as meat. Spicy dishes are marked; ask us if you'd like less heat."],
      },
      {
        heading: "Food safety",
        body: ["Our kitchen follows hygiene and temperature-control practice suited to a licensed restaurant. Delivered food is sealed and packed to stay hot; please eat it soon after it arrives, and refrigerate leftovers within two hours."],
      },
    ],
  },
  {
    slug: "delivery",
    title: "Delivery policy",
    summary: "Where we deliver, how long it takes, and what it costs.",
    sections: [
      {
        heading: "Where we deliver",
        body: [`${site.deliveryAreas.join(", ")}. Enter your address at checkout; if it's outside our area we'll let you know before you pay.`],
      },
      {
        heading: "Time",
        body: ["Most deliveries arrive in 30–45 minutes. Busy evenings, rain and traffic can add time. You can follow your order live on its tracking page."],
      },
      {
        heading: "Cost",
        body: [`Delivery is ${fee}, and free on food orders over ${free}. VAT of ${vat} is added to the food total.`],
      },
      {
        heading: "Handover",
        body: ["Our rider will call when they arrive. Please have your phone on and be ready to collect. For cash orders, please pay the exact amount if you can."],
      },
    ],
  },
];

export const legalBySlug = (slug: string) => legalPages.find((p) => p.slug === slug);
