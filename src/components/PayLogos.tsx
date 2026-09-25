import type { PaymentMethod } from "@/lib/types";

/** The real brand logos, from /public/brand/pay. "cod" has no logo, so callers show text for it. */
export const PAY_LOGO: Partial<Record<PaymentMethod, { src: string; name: string }>> = {
  bkash: { src: "/brand/pay/bkash.svg", name: "bKash" },
  nagad: { src: "/brand/pay/nagad.svg", name: "Nagad" },
  card: { src: "/brand/pay/visa.svg", name: "Visa" },
};

export function PayLogo({ method, className = "h-7" }: { method: PaymentMethod; className?: string }) {
  const l = PAY_LOGO[method];
  if (!l) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={l.src} alt={l.name} draggable={false} className={`w-auto ${className}`} />;
}

/** A row of logo tiles (white so every brand colour reads on any background). */
export default function PayLogos({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`} aria-label="Payment methods we accept">
      {(["bkash", "nagad", "card"] as PaymentMethod[]).map((m) => (
        <li key={m} className="grid h-12 w-[92px] place-items-center rounded-xl bg-page px-3">
          <PayLogo method={m} className="h-8 max-w-full" />
        </li>
      ))}
    </ul>
  );
}
