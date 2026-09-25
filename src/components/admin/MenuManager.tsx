"use client";

import { useMemo, useState } from "react";
import { cuisineName, formatBDT, type Dish } from "@/config/menu";
import { useAdmin } from "./AdminData";
import DishEditor from "./DishEditor";
import DishImage from "../DishImage";
import { PageHeader, Segmented } from "./ui";

type Status = "all" | "available" | "soldout" | "hidden";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <input
      type="checkbox"
      role="switch"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-paper-2 transition before:block before:h-6 before:w-6 before:rounded-full before:bg-ink before:transition checked:bg-basil checked:before:translate-x-5"
    />
  );
}

function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-xs font-semibold text-ink-2">No tags</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((t) => (
        <span key={t} className="rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-bold">
          {t}
        </span>
      ))}
      {tags.length > 3 && <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-bold text-ink-2">+{tags.length - 3}</span>}
    </span>
  );
}

export default function MenuManager() {
  const { dishes, tags, loaded, updateDish } = useAdmin();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [editing, setEditing] = useState<{ dish: Dish | null } | null>(null);
  const [error, setError] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return dishes.filter((d) => {
      if (tag && !d.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
      if (status === "available" && !(d.available && !d.hidden)) return false;
      if (status === "soldout" && d.available) return false;
      if (status === "hidden" && !d.hidden) return false;
      return !needle || [d.name, d.description, cuisineName(d.cuisine), ...d.tags].some((f) => f.toLowerCase().includes(needle));
    });
  }, [dishes, q, tag, status]);

  const soldOut = dishes.filter((d) => !d.available).length;
  const hidden = dishes.filter((d) => d.hidden).length;

  const toggle = async (d: Dish, patch: { available?: boolean; hidden?: boolean }) => {
    setError("");
    const err = await updateDish(d.id, patch);
    if (err) setError(err);
  };

  return (
    <>
      <PageHeader
        title="Menu"
        sub={`${dishes.length} dishes · ${soldOut} sold out today · ${hidden} hidden`}
      >
        <button onClick={() => setEditing({ dish: null })} className="h-11 rounded-full bg-tomato px-6 font-extrabold text-page shadow-[0_4px_0_var(--tomato-deep)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--tomato-deep)]">
          + Add dish
        </button>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="xl:w-80">
          <span className="sr-only">Search dishes</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, kitchen, tag…" className="h-10 w-full rounded-full border border-line bg-page px-4 text-sm outline-none focus:border-ink" />
        </label>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter by tag" value={tag} onChange={(e) => setTag(e.target.value)} className="h-10 rounded-full border border-line bg-page px-4 text-sm font-bold outline-none">
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Segmented
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "available", label: "Available" },
              { value: "soldout", label: `Sold out${soldOut ? ` (${soldOut})` : ""}` },
              { value: "hidden", label: `Hidden${hidden ? ` (${hidden})` : ""}` },
            ]}
          />
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-tomato/10 px-4 py-3 text-sm font-bold text-tomato">{error}</p>}

      {!loaded && dishes.length === 0 ? (
        <p className="py-20 text-ink-2">Loading the menu…</p>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-16">
          <p className="text-step-2 font-extrabold">No dishes match.</p>
          <p className="mt-1 text-ink-2">Try another search, tag or status.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((d) => (
            <li key={d.id} className={`flex flex-wrap items-center gap-x-5 gap-y-3 rounded-3xl border border-line bg-page p-3 pr-4 md:flex-nowrap ${d.hidden ? "opacity-60" : ""}`}>
              <button onClick={() => setEditing({ dish: d })} className="flex min-w-0 flex-1 basis-[260px] items-center gap-4 text-left" aria-label={`Edit ${d.name}`}>
                <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-paper-2">
                  <DishImage dish={d} className={`h-full w-full ${d.fit === "contain" ? "p-1" : "!rounded-none"}`} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">{d.name}</span>
                  <span className="block text-xs font-bold text-ink-2">
                    {cuisineName(d.cuisine)} · {formatBDT(d.price)}
                    {d.hidden && " · Hidden"}
                  </span>
                </span>
              </button>

              <div className="hidden basis-[260px] lg:block">
                <TagChips tags={d.tags} />
              </div>

              <label className="flex items-center gap-2 text-xs font-extrabold">
                <Switch checked={d.available} onChange={(v) => toggle(d, { available: v })} label={`${d.name} available today`} />
                <span className={`w-[68px] ${d.available ? "text-basil" : "text-tomato"}`}>{d.available ? "Available" : "Sold out"}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-extrabold">
                <Switch checked={!d.hidden} onChange={(v) => toggle(d, { hidden: !v })} label={`${d.name} shown on the menu page`} />
                <span className="w-[52px] text-ink-2">{d.hidden ? "Hidden" : "Shown"}</span>
              </label>
              <button onClick={() => setEditing({ dish: d })} className="h-10 rounded-full border-2 border-ink px-5 text-sm font-extrabold">
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}

      <DishEditor open={!!editing} dish={editing?.dish ?? null} onClose={() => setEditing(null)} />
    </>
  );
}
