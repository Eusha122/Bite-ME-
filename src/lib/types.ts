export type OrderMode = "delivery" | "pickup" | "dinein";
export type PaymentMethod = "bkash" | "nagad" | "card" | "cod";

export const ORDER_FLOW = ["placed", "accepted", "cooking", "ready", "out", "delivered"] as const;
export type OrderStatus = (typeof ORDER_FLOW)[number] | "cancelled";

export type OrderLine = { id: string; name: string; price: number; qty: number; cuisine: string };

export type Order = {
  id: string;
  code: string;
  createdAt: number;
  mode: OrderMode;
  customer: { name: string; phone: string; address?: string; table?: string };
  note?: string;
  lines: OrderLine[];
  totals: { subtotal: number; vat: number; delivery: number; total: number };
  payment: { method: PaymentMethod; status: "pending" | "paid" | "cod" };
  status: OrderStatus;
  timeline: { status: OrderStatus; at: number }[];
};

export type Reservation = {
  id: string;
  createdAt: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  note?: string;
  status: "requested" | "confirmed" | "declined";
};

/** Pickup/dine-in orders skip the "out for delivery" step. */
export const flowFor = (mode: OrderMode) =>
  mode === "delivery" ? ORDER_FLOW : ORDER_FLOW.filter((s) => s !== "out");

export const statusLabel: Record<OrderStatus, string> = {
  placed: "Order placed",
  accepted: "Accepted by the kitchen",
  cooking: "On the fire",
  ready: "Ready",
  out: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
