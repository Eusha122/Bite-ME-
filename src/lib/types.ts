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
  payment: { method: PaymentMethod; status: "pending" | "paid" | "cod"; paidAt?: number };
  status: OrderStatus;
  timeline: { status: OrderStatus; at: number }[];
  /** internal, never shown to the guest */
  staffNote?: string;
  cancelReason?: string;
};

/** Statuses an order may move to from where it is now. Finished orders are frozen. */
export function nextStatuses(o: Pick<Order, "mode" | "status">): OrderStatus[] {
  if (o.status === "delivered" || o.status === "cancelled") return [];
  const flow = flowFor(o.mode);
  const i = flow.indexOf(o.status);
  return [...flow.slice(i + 1), "cancelled"];
}

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
export const flowFor = (mode: OrderMode): readonly OrderStatus[] =>
  mode === "delivery" ? ORDER_FLOW : ORDER_FLOW.filter((s) => s !== "out");

/** Short labels for the admin panel's status badges and tabs. */
export const statusShort: Record<OrderStatus, string> = {
  placed: "New",
  accepted: "Accepted",
  cooking: "Cooking",
  ready: "Ready",
  out: "On the way",
  delivered: "Completed",
  cancelled: "Cancelled",
};

export const statusLabel: Record<OrderStatus, string> = {
  placed: "Order placed",
  accepted: "Accepted by the kitchen",
  cooking: "On the fire",
  ready: "Ready",
  out: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
