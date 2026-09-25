"use client";

import { useEffect, useRef, useState } from "react";
import { cuisines, formatBDT, type CuisineId, type Dish } from "@/config/menu";
import { useAdmin, type DishDraft } from "./AdminData";
import DishImage from "../DishImage";

const MAX_TAGS = 12;

const field = "h-12 w-full rounded-2xl border-2 border-line bg-page px-4 font-semibold outline-none focus:border-ink";
const labelCls = "flex flex-col gap-1.5 text-sm font-extrabold text-ink-2";

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

/** Selected tags as removable chips, plus a box to add existing or brand-new ones. */
function TagPicker({ value, onChange, all }: { value: string[]; onChange: (t: string[]) => void; all: string[] }) {
  const [text, setText] = useState("");
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const t = raw.replace(/\s+/g, " ").trim().slice(0, 24);
    if (!t || has(t) || value.length >= MAX_TAGS) return setText("");
    // reuse the existing spelling ("spicy" → "Spicy") so tags never split in two
    onChange([...value, all.find((a) => a.toLowerCase() === t.toLowerCase()) ?? t]);
    setText("");
  };
  const q = text.trim().toLowerCase();
  const suggestions = all.filter((t) => !has(t) && (!q || t.toLowerCase().includes(q))).slice(0, 12);
  const isNew = q && !all.some((t) => t.toLowerCase() === q) && !has(text);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.length === 0 && <span className="text-sm font-semibold text-ink-2">No tags yet.</span>}
        {value.map((t) => (
          <span key={t} className="inline-flex h-9 items-center gap-2 rounded-full bg-ink pl-4 pr-1.5 text-sm font-extrabold text-page">
            {t}
            <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(value.filter((v) => v !== t))} className="grid h-6 w-6 place-items-center rounded-full bg-page/20 text-xs">
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder="Type a tag and press Enter…"
        maxLength={24}
        className={`${field} mt-3`}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {isNew && (
          <button type="button" onClick={() => add(text)} className="h-9 rounded-full border-2 border-tomato px-4 text-sm font-extrabold text-tomato">
            + Create “{text.trim()}”
          </button>
        )}
        {suggestions.map((t) => (
          <button key={t} type="button" onClick={() => add(t)} className="h-9 rounded-full border-2 border-line bg-page px-4 text-sm font-bold">
            + {t}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-ink-2">Guests never see tags on a dish. They only appear as filter buttons on the menu page.</p>
    </div>
  );
}

const blank = (): DishDraft => ({ name: "", cuisine: "deshi", line: "", description: "", price: 0, prepMinutes: 15, image: "", fit: "cover", tags: [], spicy: false, veg: false, available: true, hidden: false });

function Form({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  const { tags: allTags, createDish, updateDish, deleteDish, uploadPhoto } = useAdmin();
  const [d, setD] = useState<DishDraft>(() => (dish ? { name: dish.name, cuisine: dish.cuisine, line: dish.line, description: dish.description, price: dish.price, prepMinutes: dish.prepMinutes, image: dish.image, fit: dish.fit, tags: dish.tags, spicy: !!dish.spicy, veg: !!dish.veg, available: dish.available, hidden: dish.hidden } : blank()));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof DishDraft>(k: K, v: DishDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    const r = await uploadPhoto(file);
    setUploading(false);
    if ("error" in r) return setError(r.error);
    setD((x) => ({ ...x, image: r.url, fit: r.fit }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = dish ? await updateDish(dish.id, d) : await createDish(d);
    setBusy(false);
    if (err) return setError(err);
    onClose();
  };

  const remove = async () => {
    if (!dish) return;
    setBusy(true);
    const err = await deleteDish(dish.id);
    setBusy(false);
    if (err) {
      setConfirmDelete(false);
      return setError(err);
    }
    onClose();
  };

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {/* photo */}
        <div className="flex items-center gap-4 rounded-3xl bg-page p-4">
          <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-paper-2">
            {d.image ? <DishImage dish={{ image: d.image, fit: d.fit, name: d.name || "Dish photo" }} eager className={`h-full w-full ${d.fit === "contain" ? "p-2" : "!rounded-none"}`} /> : <span className="px-2 text-center text-xs font-bold text-ink-2">No photo yet</span>}
          </div>
          <div className="min-w-0 flex-1">
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="h-11 rounded-full bg-ink px-5 text-sm font-extrabold text-page disabled:opacity-60">
              {uploading ? "Uploading…" : d.image ? "Replace photo" : "Upload photo"}
            </button>
            {d.image && (
              <div role="radiogroup" aria-label="Photo fit" className="mt-3 inline-flex rounded-full border-2 border-line p-0.5 text-xs font-extrabold">
                {(["cover", "contain"] as const).map((f) => (
                  <button key={f} type="button" role="radio" aria-checked={d.fit === f} onClick={() => set("fit", f)} className={`h-8 rounded-full px-3 ${d.fit === f ? "bg-ink text-page" : "text-ink-2"}`}>
                    {f === "cover" ? "Fill card" : "Fit inside"}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs font-semibold text-ink-2">JPG, PNG or WebP · up to 8 MB. A square photo looks best.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className={labelCls}>
            Name
            <input value={d.name} onChange={(e) => set("name", e.target.value)} required minLength={2} maxLength={60} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={labelCls}>
              Kitchen
              <select value={d.cuisine} onChange={(e) => set("cuisine", e.target.value as CuisineId)} className={field}>
                {cuisines.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Price (Tk)
              <input type="number" inputMode="numeric" min={1} max={100000} step={1} value={d.price || ""} onChange={(e) => set("price", Number(e.target.value))} required className={field} />
            </label>
          </div>
          <label className={labelCls}>
            Short line (optional)
            <input value={d.line} onChange={(e) => set("line", e.target.value)} maxLength={90} placeholder="One punchy sentence" className={field} />
          </label>
          <label className={labelCls}>
            Description
            <textarea value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={600} rows={4} placeholder="What's in it, how it's cooked…" className={`${field} h-auto py-3`} />
          </label>
          <label className={labelCls}>
            Cooking time (minutes)
            <input type="number" inputMode="numeric" min={1} max={180} value={d.prepMinutes || ""} onChange={(e) => set("prepMinutes", Number(e.target.value))} className={field} />
          </label>

          <div className="rounded-3xl bg-page p-4">
            <p className="mb-3 text-sm font-extrabold text-ink-2">Tags</p>
            <TagPicker value={d.tags} onChange={(t) => set("tags", t)} all={allTags} />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-extrabold">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!d.veg} onChange={(e) => set("veg", e.target.checked)} className="h-5 w-5 accent-[var(--basil)]" /> Vegetarian
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!d.spicy} onChange={(e) => set("spicy", e.target.checked)} className="h-5 w-5 accent-[var(--tomato)]" /> Spicy
            </label>
          </div>

          <div className="divide-y divide-line rounded-3xl bg-page px-4">
            <label className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block font-extrabold">Available today</span>
                <span className="text-xs font-semibold text-ink-2">Off = shown as “Sold out today”, can&apos;t be ordered.</span>
              </span>
              <Switch checked={d.available} onChange={(v) => set("available", v)} label="Available today" />
            </label>
            <label className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block font-extrabold">Show on the menu page</span>
                <span className="text-xs font-semibold text-ink-2">Off = hidden from guests completely.</span>
              </span>
              <Switch checked={!d.hidden} onChange={(v) => set("hidden", !v)} label="Show on the menu page" />
            </label>
          </div>
        </div>

        {dish && (
          <div className="mt-6">
            {dish.locked ? (
              <p className="text-xs font-semibold text-ink-2">This dish appears in the homepage table film, so it can&apos;t be deleted — turn off “Show on the menu page” to hide it.</p>
            ) : confirmDelete ? (
              <div className="rounded-2xl border-2 border-tomato/40 bg-tomato/5 p-4">
                <p className="font-extrabold">Delete {dish.name}? Past orders keep their own record.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={remove} disabled={busy} className="h-10 flex-1 rounded-full bg-tomato text-sm font-extrabold text-page disabled:opacity-60">
                    Delete dish
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="h-10 flex-1 rounded-full border-2 border-line text-sm font-bold">
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm font-extrabold text-tomato">
                Delete this dish…
              </button>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line bg-paper px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {error && <p className="mb-3 rounded-xl bg-tomato/10 px-4 py-3 text-sm font-bold text-tomato">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="h-12 rounded-full border-2 border-line px-6 font-extrabold">
            Cancel
          </button>
          <button disabled={busy || uploading} className="h-12 flex-1 rounded-full bg-ink font-extrabold text-page disabled:opacity-60">
            {busy ? "Saving…" : dish ? `Save changes${d.price ? ` · ${formatBDT(d.price)}` : ""}` : "Add dish"}
          </button>
        </div>
      </div>
    </form>
  );
}

/** Right-hand drawer; `dish` null with `open` true means "add a new dish". */
export default function DishEditor({ open, dish, onClose }: { open: boolean; dish: Dish | null; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label={dish ? `Edit ${dish.name}` : "Add a dish"}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-paper transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <h2 className="puff puff-ink text-step-4">{dish ? "Edit dish" : "Add a dish"}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full border-2 border-line">
            ✕
          </button>
        </div>
        {/* keyed so the form starts fresh for every dish (and for "new") */}
        {open && <Form key={dish?.id ?? "new"} dish={dish} onClose={onClose} />}
      </aside>
    </div>
  );
}
