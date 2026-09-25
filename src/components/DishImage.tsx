import type { Dish } from "@/config/menu";

/**
 * A dish photo at any size. Transparent cut-outs sit inside their frame; full photos
 * (admin uploads) fill it and get rounded corners. With no dish, a plain cream tile.
 */
export default function DishImage({ dish, className = "", eager = false }: { dish: Pick<Dish, "image" | "fit" | "name"> | undefined; className?: string; eager?: boolean }) {
  if (!dish) return <span className={`block bg-paper-2 ${className}`} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dish.image}
      alt={dish.name}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`${dish.fit === "cover" ? "rounded-2xl object-cover" : "object-contain"} ${className}`}
    />
  );
}
