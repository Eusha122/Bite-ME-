"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cuisineName, formatBDT, type Dish } from "@/config/menu";
import { site } from "@/config/site";
import { useCart, flyToCart } from "@/lib/cart";
import DishImage from "../DishImage";
import { PayLogo } from "../PayLogos";

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-4 py-3 md:grid-cols-[110px_1fr]">
      <dt className="text-step--1 font-extrabold uppercase tracking-[0.14em] text-ink-2">{label}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}

/** Quantity is reset for every dish because the parent keys this on the dish id. */
function Panel({ dish, related, onClose, onSelect }: { dish: Dish; related: Dish[]; onClose: () => void; onSelect: (id: string) => void }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const addBtn = useRef<HTMLButtonElement>(null);
  const soldOut = !dish.available;

  const addToCart = (goToCheckout: boolean) => {
    add(dish.id, qty);
    if (goToCheckout) {
      // just navigate: closing the sheet first would race a history "back" against this push
      router.push("/checkout");
      return;
    }
    const r = addBtn.current?.getBoundingClientRect();
    if (r) flyToCart(dish.image, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    onClose();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[1.05fr_1fr]">
      {/* photo */}
      <div className="relative shrink-0 bg-page md:min-h-0">
        <div className="aspect-[5/4] w-full md:absolute md:inset-0 md:aspect-auto">
          <DishImage dish={dish} eager className={`h-full w-full ${dish.fit === "contain" ? "p-6 md:p-12" : "!rounded-none"} ${soldOut ? "opacity-60 grayscale" : ""}`} />
        </div>
      </div>

      {/* details */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-6 md:px-10 md:pb-8 md:pt-10">
          <p className="text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">{cuisineName(dish.cuisine)} kitchen</p>
          <h2 id="dish-title" className="puff puff-tomato mt-3 text-step-6">
            {dish.name}
          </h2>
          {dish.line && <p className="mt-4 text-step-1 font-extrabold">{dish.line}</p>}
          <p className="mt-3 max-w-[52ch] font-semibold leading-relaxed text-ink-2">{dish.description}</p>

          {(dish.veg || dish.spicy) && (
            <p className="mt-4 flex flex-wrap gap-2 text-sm font-extrabold">
              {dish.veg && <span className="rounded-full border-2 border-basil px-3 py-1 text-basil">Vegetarian</span>}
              {dish.spicy && <span className="rounded-full border-2 border-tomato px-3 py-1 text-tomato">Spicy</span>}
            </p>
          )}

          <p className="puff puff-ink mt-6 text-step-6">{formatBDT(dish.price)}</p>

          <h3 className="mb-1 mt-8 text-step--1 font-extrabold uppercase tracking-[0.18em] text-ink-2">Order info</h3>
          <dl className="divide-y divide-line border-y border-line text-sm">
            <Info label="Kitchen">About {dish.prepMinutes} min to cook, fresh to order</Info>
            <Info label="Delivery">
              30–45 min to {site.deliveryAreas.slice(0, 3).join(", ")} and more · {formatBDT(site.delivery.fee)}, free over {formatBDT(site.delivery.freeAbove)}
            </Info>
            <Info label="Pickup">Ready in about 20 min at {site.address.split(",").slice(0, 2).join(",")}</Info>
            <Info label="Dine-in">Scan the QR code on your table and order from your phone</Info>
            <Info label="Payment">
              <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {site.payments
                  .filter((p) => p !== "cod")
                  .map((p) => (
                    <PayLogo key={p} method={p} className="h-6" />
                  ))}
                <span>or cash</span>
              </span>
              <span className="mt-1 block text-xs font-semibold text-ink-2">VAT {Math.round(site.delivery.vatRate * 100)}% added at checkout</span>
            </Info>
          </dl>

          {related.length > 0 && (
            <>
              <h3 className="mb-3 mt-8 text-step--1 font-extrabold uppercase tracking-[0.18em] text-ink-2">More like this</h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
                {related.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => onSelect(r.id)} className="flex w-full flex-col gap-2 rounded-2xl bg-page p-2 text-left active:bg-paper-2">
                      <div className="aspect-square overflow-hidden rounded-xl bg-paper-2">
                        <DishImage dish={r} className={`h-full w-full ${r.fit === "contain" ? "p-1.5" : "!rounded-none"}`} />
                      </div>
                      <span className="line-clamp-2 px-1 text-sm font-extrabold leading-tight">{r.name}</span>
                      <span className="px-1 pb-1 text-xs font-bold text-ink-2">{formatBDT(r.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* order bar */}
        <div className="shrink-0 border-t border-line bg-paper px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-10 md:pb-6">
          {soldOut ? (
            <p className="rounded-2xl bg-paper-2 px-4 py-4 text-center font-extrabold text-ink-2">Sold out today — back tomorrow.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center rounded-full border-2 border-ink">
                  <button aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-11 place-items-center text-xl font-bold">
                    −
                  </button>
                  <span className="w-7 text-center text-step-1 font-extrabold tabular-nums" aria-live="polite">
                    {qty}
                  </span>
                  <button aria-label="More" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid h-12 w-11 place-items-center text-xl font-bold">
                    +
                  </button>
                </div>
                <button
                  onClick={() => addToCart(true)}
                  className="h-14 min-w-0 flex-1 whitespace-nowrap rounded-full bg-tomato px-4 text-step-1 font-extrabold text-page shadow-[0_5px_0_var(--tomato-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--tomato-deep)]"
                >
                  Order now · {formatBDT(dish.price * qty)}
                </button>
              </div>
              <button ref={addBtn} onClick={() => addToCart(false)} className="h-12 rounded-full border-2 border-ink font-extrabold">
                Add to cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Full-height sheet on phones, a large centred panel on desktop. */
export default function DishSheet({ dish, related, onClose, onSelect }: { dish: Dish | null; related: Dish[]; onClose: () => void; onSelect: (id: string) => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dish) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [dish, onClose]);

  if (!dish) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div onClick={onClose} className="absolute inset-0 animate-[fade-in_.25s_ease-out] bg-ink/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="absolute inset-x-0 bottom-0 top-10 flex animate-[sheet-in_.35s_cubic-bezier(.2,.8,.2,1)] flex-col overflow-hidden rounded-t-[32px] bg-paper md:inset-x-[6vw] md:bottom-8 md:top-8 md:rounded-[32px] xl:inset-x-[10vw]"
      >
        <button ref={closeBtn} onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper text-lg font-bold md:right-5 md:top-5">
          ✕
        </button>
        {/* keyed so the quantity starts at 1 for each dish */}
        <Panel key={dish.id} dish={dish} related={related} onClose={onClose} onSelect={onSelect} />
      </div>
    </div>
  );
}
