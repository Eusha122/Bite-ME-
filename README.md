# BiteME — scroll-film restaurant template

A cinematic, scroll-driven restaurant site with real online ordering. Every visual on the home page is **AI-generated video, scrubbed frame-by-frame by scroll** (Apple-style image sequences on `<canvas>`), on a flat cream design system with puffy display type.

- **Story films** — burger assembling, kacchi handi opening, pizza cheese-pull, ramen noodle-lift.
- **Rotating table menu** — a lazy susan turns a quarter-turn per dish as you scroll; each dish stops in front with its story, price and *Order now*.
- **Menu page** (`/menu`) — every dish with photo, price and description; live search; tag filter buttons; tap a dish for details, order info and ordering. Table QR codes open `/menu?table=7`.
- **Ordering** — cart, checkout (delivery / pickup / dine-in QR), bKash · Nagad · card · cash (demo gateway), live order tracking.
- **Staff** — `/kitchen` live kitchen display with chime; `/admin` order management, sales overview, **menu manager** (add/edit dishes, upload photos, sold-out and hide switches), **tag manager**, reservations, printable table QR codes. Demo PIN `1234`. There is deliberately no link to it on the public site — staff type `/admin` (or `/kitchen`) into the address bar.

## Menu and tags

The menu lives in the database (`.data/db.json`), seeded on first run from `src/config/menu.ts` (40 dishes). After that the admin panel owns it:

- **Dishes** — `/admin/menu`: name, kitchen, price, photo (uploaded photos are converted to 900px WebP and stored in `.data/uploads`), description, cooking time, vegetarian/spicy notes, *Available today* and *Show on the menu page* switches. Dishes shown in the homepage table film can be hidden but not deleted.
- **Tags** — `/admin/tags`: create, rename, delete and reorder tags, and choose which dishes carry each. Tags are **never shown on a dish**; guests only see them as filter buttons (and can search by them). A tag with no visible dishes doesn't appear.
- Orders keep their own copy of each dish's name and price, so menu edits never change past orders.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Environment (set in production):

| Var | Purpose |
|---|---|
| `STAFF_PIN` | PIN for kitchen + dashboard (default `1234`) |
| `STAFF_SECRET` | HMAC secret for the staff cookie |

Orders are stored in `.data/db.json` — fine for a demo or a single-location VPS. For serverless hosting, replace `src/lib/db.ts` with Postgres/Supabase (the API routes only call its exported functions).

## Re-skinning for a new restaurant

1. **Brand & info** — `src/config/site.ts` (name, address, hours, phone, VAT, delivery fee).
2. **Menu** — seed catalogue in `src/config/menu.ts` (delete `.data/db.json` to re-seed), or just edit it in the admin panel. `TABLE_DISH_IDS` lists the ten dishes the homepage table film rotates through.
3. **Dish photos** — `public/menu/<id>.webp` for seed dishes (transparent cut-outs); new dishes are uploaded in the admin panel.
4. **Logo** — `public/brand/logo.webp`.
5. **Colours** — tokens at the top of `src/app/globals.css`. `--paper` must match the background baked into the films.
6. **Films** — see below. Story copy lives in `src/components/film/Home.tsx`.

## Making the films

Each film is generated as **start frame → end frame → video**, then sliced into frames:

1. Generate a start and an end still on a flat cream background (same camera, same subject).
2. Generate a video between them (MiniMax H3 keyframe mode, 6–8 s, locked-off camera).
3. Slice it:

```bash
node scripts/extract-frames.mjs <name> <framesPerClip> <clip.mp4> [more clips...]
# story scene:  node scripts/extract-frames.mjs pizza 120 assets-src/video/pizza.mp4
# rotating table (9 chained quarter-turns): npm run film:table
```

This writes `public/film/<name>/{d,m}/NNN.webp` (desktop 1440px / phone 900px) and `meta.json`. A scene appears automatically once its `meta.json` exists. Frames load progressively (coarse → fine) and only when a scene is about three screens away.

## Structure

```
src/components/film/   FilmScene (scroll-scrubbed canvas + kinetic copy), MenuTable, Intro, frame loader
src/components/shop/   cart drawer, checkout, order tracker
src/components/staff/  kitchen display, dashboard, PIN gate
src/app/api/           orders, reservations, sold-out, staff auth
scripts/               extract-frames.mjs, fetch-assets.mjs
```

Live payments: wallet/card orders are marked paid in demo mode. Wire SSLCommerz (covers bKash, Nagad and cards) at the order-creation step before going live.
