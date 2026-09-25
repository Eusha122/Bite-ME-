"use client";

import { useState } from "react";
import { cuisineName, type Dish } from "@/config/menu";
import { useAdmin } from "./AdminData";
import DishImage from "../DishImage";
import { PageHeader } from "./ui";

const field = "h-11 rounded-full border-2 border-line bg-page px-4 font-semibold outline-none focus:border-ink";

/** Checklist: tick the dishes that carry this tag. Each tick is saved straight away. */
function DishChecklist({ tag }: { tag: string }) {
  const { dishes, tagOperation } = useAdmin();
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  // ticks show instantly; an entry is dropped once the server has answered (or failed, which reverts it)
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const saved = (d: Dish) => d.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
  const carries = (d: Dish) => pending[d.id] ?? saved(d);
  const needle = q.trim().toLowerCase();
  const list = dishes.filter((d) => !needle || [d.name, cuisineName(d.cuisine)].some((f) => f.toLowerCase().includes(needle)));

  const toggle = async (d: Dish) => {
    setError("");
    const want = !carries(d);
    const ids = new Set(dishes.filter(carries).map((x) => x.id));
    if (want) ids.add(d.id);
    else ids.delete(d.id);
    setPending((p) => ({ ...p, [d.id]: want }));
    const err = await tagOperation({ action: "assign", name: tag, dishIds: [...ids] });
    if (err) setError(err);
    setPending((p) => {
      const next = { ...p };
      delete next[d.id];
      return next;
    });
  };

  return (
    <div className="mt-4 rounded-2xl bg-paper p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-extrabold">Choose the dishes that carry “{tag}”</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter dishes…" className="h-9 rounded-full border border-line bg-page px-4 text-sm outline-none focus:border-ink" />
      </div>
      {error && <p className="mb-3 text-sm font-bold text-tomato">{error}</p>}
      <ul className="grid max-h-[360px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((d) => (
          <li key={d.id}>
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${carries(d) ? "bg-page" : ""}`}>
              <input type="checkbox" checked={carries(d)} onChange={() => toggle(d)} className="h-5 w-5 shrink-0 accent-[var(--tomato)]" />
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-2">
                <DishImage dish={d} className={`h-full w-full ${d.fit === "contain" ? "p-0.5" : "!rounded-none"}`} />
              </span>
              <span className="min-w-0 text-sm">
                <span className="block truncate font-extrabold">{d.name}</span>
                <span className="text-xs font-semibold text-ink-2">{cuisineName(d.cuisine)}</span>
              </span>
            </label>
          </li>
        ))}
        {list.length === 0 && <li className="px-3 py-2 text-sm font-semibold text-ink-2">No dishes match.</li>}
      </ul>
    </div>
  );
}

function TagRow({ tag, index, last }: { tag: string; index: number; last: boolean }) {
  const { dishes, tagOperation } = useAdmin();
  const [mode, setMode] = useState<"idle" | "rename" | "delete" | "dishes">("idle");
  const [name, setName] = useState(tag);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const carrying = dishes.filter((d) => d.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
  const visible = carrying.filter((d) => !d.hidden).length;

  const run = async (op: Parameters<typeof tagOperation>[0], after?: () => void) => {
    setBusy(true);
    setError("");
    const err = await tagOperation(op);
    setBusy(false);
    if (err) return setError(err);
    after?.();
  };

  const btn = "h-9 rounded-full border-2 border-line px-4 text-sm font-extrabold disabled:opacity-40";

  return (
    <li className="rounded-3xl border border-line bg-page p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex shrink-0 flex-col">
          <button aria-label={`Move ${tag} up`} disabled={index === 0 || busy} onClick={() => run({ action: "move", name: tag, direction: -1 })} className="grid h-5 w-8 place-items-center text-xs disabled:opacity-25">
            ▲
          </button>
          <button aria-label={`Move ${tag} down`} disabled={last || busy} onClick={() => run({ action: "move", name: tag, direction: 1 })} className="grid h-5 w-8 place-items-center text-xs disabled:opacity-25">
            ▼
          </button>
        </div>

        {mode === "rename" ? (
          <form
            className="flex min-w-0 flex-1 basis-[240px] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run({ action: "rename", from: tag, to: name }, () => setMode("idle"));
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoFocus aria-label="New tag name" className={`${field} h-10 min-w-0 flex-1`} />
            <button className="h-10 rounded-full bg-ink px-4 text-sm font-extrabold text-page">Save</button>
            <button type="button" onClick={() => (setMode("idle"), setName(tag))} className={btn}>
              Cancel
            </button>
          </form>
        ) : (
          <div className="min-w-0 flex-1 basis-[200px]">
            <p className="truncate text-step-1 font-extrabold">{tag}</p>
            <p className="text-xs font-bold text-ink-2">
              {carrying.length} {carrying.length === 1 ? "dish" : "dishes"}
              {visible === 0 ? <span className="text-tomato"> · not shown to guests (no visible dishes)</span> : <span> · shown as a filter on the menu page</span>}
            </p>
          </div>
        )}

        {mode !== "rename" && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setMode(mode === "dishes" ? "idle" : "dishes")} aria-expanded={mode === "dishes"} className={`${btn} ${mode === "dishes" ? "border-ink bg-ink text-page" : ""}`}>
              Choose dishes
            </button>
            <button onClick={() => (setMode("rename"), setName(tag))} className={btn}>
              Rename
            </button>
            <button onClick={() => setMode("delete")} className={`${btn} text-tomato`}>
              Delete
            </button>
          </div>
        )}
      </div>

      {mode === "delete" && (
        <div className="mt-4 rounded-2xl border-2 border-tomato/40 bg-tomato/5 p-4">
          <p className="font-extrabold">
            Delete “{tag}”?{carrying.length > 0 && ` It will be removed from ${carrying.length} ${carrying.length === 1 ? "dish" : "dishes"}.`} The dishes themselves stay.
          </p>
          <div className="mt-3 flex gap-2">
            <button disabled={busy} onClick={() => run({ action: "delete", name: tag })} className="h-10 rounded-full bg-tomato px-5 text-sm font-extrabold text-page disabled:opacity-60">
              Delete tag
            </button>
            <button onClick={() => setMode("idle")} className={btn}>
              Keep it
            </button>
          </div>
        </div>
      )}
      {mode === "dishes" && <DishChecklist tag={tag} />}
      {error && <p className="mt-3 text-sm font-bold text-tomato">{error}</p>}
    </li>
  );
}

export default function TagsManager() {
  const { tags, dishes, loaded, tagOperation } = useAdmin();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await tagOperation({ action: "create", name });
    setBusy(false);
    if (err) return setError(err);
    setName("");
  };

  return (
    <>
      <PageHeader title="Tags" sub="Guests never see tags on a dish. Each tag shows up as a filter button on the menu page — in the order you set here." />

      <form onSubmit={create} className="mb-6 flex flex-wrap items-center gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="New tag, e.g. “Family sharing”" aria-label="New tag name" className={`${field} w-full sm:w-80`} />
        <button disabled={busy || !name.trim()} className="h-11 rounded-full bg-ink px-6 font-extrabold text-page disabled:opacity-40">
          + Add tag
        </button>
        {error && <span className="text-sm font-bold text-tomato">{error}</span>}
      </form>

      {!loaded && tags.length === 0 ? (
        <p className="py-16 text-ink-2">Loading tags…</p>
      ) : tags.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-16">
          <p className="text-step-2 font-extrabold">No tags yet.</p>
          <p className="mt-1 text-ink-2">Add one above, then choose which dishes carry it.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tags.map((t, i) => (
            <TagRow key={t} tag={t} index={i} last={i === tags.length - 1} />
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs font-semibold text-ink-2">{dishes.length} dishes in total. You can also tag a dish from the Menu page when you edit it.</p>
    </>
  );
}
