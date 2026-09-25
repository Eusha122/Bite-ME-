export type CuisineId = "deshi" | "japanese" | "indian" | "italian" | "chinese" | "burgers" | "drinks";

export type Cuisine = { id: CuisineId; name: string };

export const cuisines: Cuisine[] = [
  { id: "deshi", name: "Deshi" },
  { id: "japanese", name: "Japanese" },
  { id: "indian", name: "Indian" },
  { id: "italian", name: "Italian" },
  { id: "chinese", name: "Chinese" },
  { id: "burgers", name: "Burgers" },
  { id: "drinks", name: "Drinks" },
];

/**
 * A dish as stored in the database and edited from the admin panel.
 * `tags` are staff-only labels: guests never see them on a dish, they only appear
 * as filter buttons on the menu page.
 */
export type Dish = {
  id: string;
  cuisine: CuisineId;
  name: string;
  /** one punchy line shown on the detail page */
  line: string;
  description: string;
  price: number; // BDT
  prepMinutes: number;
  /** public URL of the photo: /menu/<id>.webp or an admin upload */
  image: string;
  /** "contain" for transparent cut-outs, "cover" for full photos */
  fit: "contain" | "cover";
  tags: string[];
  spicy?: boolean;
  veg?: boolean;
  /** false = shown as "sold out today" and can't be ordered */
  available: boolean;
  /** true = removed from the public menu page */
  hidden: boolean;
  /** dishes shown in the homepage film can be hidden but not deleted */
  locked?: boolean;
  order: number;
};

type Seed = Omit<Dish, "image" | "fit" | "available" | "hidden" | "order" | "locked"> & { locked?: true };

const s = (d: Seed): Seed => d;

const SEED: Seed[] = [
  // ——— Deshi ———
  s({ id: "kacchi-biryani", cuisine: "deshi", name: "Old Dhaka Kacchi", line: "Sealed in dough. Opened at your table.", description: "Our kacchi biryani: mutton and aged basmati layered in a copper handi, dum-cooked for three hours with saffron, ghee and a golden aloo.", price: 750, prepMinutes: 18, tags: ["Deshi", "Signature", "Rice"], locked: true }),
  s({ id: "beef-tehari", cuisine: "deshi", name: "Beef Tehari", line: "The Puran Dhaka street classic.", description: "Mustard-oil rice, tender beef and whole green chillies, cooked the way it is on the old-city lanes.", price: 480, prepMinutes: 14, spicy: true, tags: ["Deshi", "Spicy", "Rice"] }),
  s({ id: "ilish-bhapa", cuisine: "deshi", name: "Shorshe Ilish", line: "Padma hilsa, sharp mustard, banana leaf.", description: "Hilsa steaks steamed in a pungent mustard-green-chilli paste, the way every Bengali grandmother insists it should be.", price: 1200, prepMinutes: 22, spicy: true, tags: ["Deshi", "Spicy", "Seafood"], locked: true }),
  s({ id: "chicken-rezala", cuisine: "deshi", name: "Chicken Rezala", line: "Ivory gravy, dried chilli, Mughal-era Dhaka.", description: "A silky yogurt-and-cashew gravy scented with kewra, finished with a single dried red chilli.", price: 650, prepMinutes: 16, tags: ["Deshi", "Comfort food"] }),
  s({ id: "morog-polao", cuisine: "deshi", name: "Morog Polao", line: "Wedding-day rice, every day.", description: "Fragrant ghee polao with a chicken leg quarter, raisins, fried onions and a boiled egg.", price: 560, prepMinutes: 15, tags: ["Deshi", "Rice", "Comfort food"] }),
  s({ id: "mishti-doi", cuisine: "deshi", name: "Bogura Mishti Doi", line: "Caramel-dark, set in clay.", description: "Sweet yogurt slow-set in an earthen pot until it turns the colour of toffee.", price: 180, prepMinutes: 2, veg: true, tags: ["Deshi", "Dessert", "Vegetarian"] }),

  // ——— Japanese ———
  s({ id: "tonkotsu-ramen", cuisine: "japanese", name: "Tonkotsu Ramen", line: "Eighteen hours of broth in every spoon.", description: "Pork-bone broth simmered overnight, chashu, a jammy soy egg, nori and fresh noodles pulled to order.", price: 950, prepMinutes: 12, tags: ["Japanese", "Noodles", "Comfort food"], locked: true }),
  s({ id: "salmon-nigiri", cuisine: "japanese", name: "Salmon Nigiri", line: "Six pieces. Hand-pressed. Never rushed.", description: "Norwegian salmon over body-temperature shari, brushed with nikiri, pickled ginger and fresh wasabi on the side.", price: 890, prepMinutes: 10, tags: ["Japanese", "Seafood", "Light"], locked: true }),
  s({ id: "dragon-roll", cuisine: "japanese", name: "Dragon Roll", line: "Prawn tempura wearing avocado scales.", description: "Prawn tempura inside, thin-fanned avocado outside, glazed with unagi sauce and finished with tobiko.", price: 1150, prepMinutes: 12, tags: ["Japanese", "Seafood", "Signature"] }),
  s({ id: "katsu-curry", cuisine: "japanese", name: "Chicken Katsu Curry", line: "Crunch on top, velvet underneath.", description: "A panko-crusted chicken cutlet over sticky rice with a rich, gently sweet Japanese curry.", price: 820, prepMinutes: 14, tags: ["Japanese", "Comfort food", "Rice"] }),
  s({ id: "prawn-tempura", cuisine: "japanese", name: "Prawn Tempura", line: "Lace-light batter, tiger prawns.", description: "Four tiger prawns in a feather-thin batter, fried to order and served with tentsuyu dipping sauce.", price: 980, prepMinutes: 10, tags: ["Japanese", "Seafood", "Light"] }),
  s({ id: "matcha-mochi", cuisine: "japanese", name: "Matcha Mochi", line: "Soft, green, bittersweet.", description: "Chewy mochi wrapped around a red-bean heart, dusted with ceremonial-grade matcha.", price: 390, prepMinutes: 3, veg: true, tags: ["Japanese", "Dessert", "Vegetarian"] }),

  // ——— Indian ———
  s({ id: "butter-chicken", cuisine: "indian", name: "Butter Chicken", line: "Tandoor smoke, tomato silk, cold butter.", description: "Chicken charred in a 480° tandoor, folded into a makhani of tomatoes, fenugreek and a stubborn amount of butter.", price: 780, prepMinutes: 15, tags: ["Indian", "Signature", "Comfort food"], locked: true }),
  s({ id: "rogan-josh", cuisine: "indian", name: "Mutton Rogan Josh", line: "Kashmiri chilli, slow-braised.", description: "Mutton braised for hours with fennel, ginger and Kashmiri chilli until the oil turns ruby red.", price: 980, prepMinutes: 18, spicy: true, tags: ["Indian", "Spicy"] }),
  s({ id: "paneer-tikka", cuisine: "indian", name: "Paneer Tikka", line: "Charred at the edges, soft inside.", description: "Cottage cheese, peppers and onion marinated in spiced yogurt and blistered in the tandoor.", price: 620, prepMinutes: 12, veg: true, tags: ["Indian", "Vegetarian", "Light"] }),
  s({ id: "dum-biryani", cuisine: "indian", name: "Hyderabadi Dum Biryani", line: "Layers, steam and saffron.", description: "Chicken and long-grain rice layered with mint, saffron and fried onion, sealed and cooked on dum.", price: 690, prepMinutes: 16, spicy: true, tags: ["Indian", "Spicy", "Rice"] }),
  s({ id: "garlic-naan", cuisine: "indian", name: "Garlic Naan", line: "Blistered in the tandoor.", description: "Soft, charred naan brushed with garlic butter the moment it leaves the clay wall.", price: 120, prepMinutes: 5, veg: true, tags: ["Indian", "Bread", "Vegetarian"] }),
  s({ id: "dal-makhani", cuisine: "indian", name: "Dal Makhani", line: "Overnight lentils, cream and butter.", description: "Black lentils simmered overnight with butter and cream until they turn thick and smoky.", price: 420, prepMinutes: 8, veg: true, tags: ["Indian", "Comfort food", "Vegetarian"] }),

  // ——— Italian ———
  s({ id: "margherita", cuisine: "italian", name: "Margherita", line: "Ninety seconds at 450°. Leopard spots included.", description: "Forty-eight-hour dough, San Marzano tomato, fior di latte and basil — fired in a wood dome until it blisters.", price: 850, prepMinutes: 10, veg: true, tags: ["Italian", "Pizza", "Vegetarian", "Signature"], locked: true }),
  s({ id: "truffle-pizza", cuisine: "italian", name: "Truffle Funghi", line: "Wild mushrooms, truffle cream.", description: "A white pizza of wild mushrooms, truffle cream, shaved parmigiano and thyme on a charred, puffed crust.", price: 1250, prepMinutes: 11, tags: ["Italian", "Pizza"] }),
  s({ id: "pepperoni-inferno", cuisine: "italian", name: "Pepperoni Inferno", line: "Cupped pepperoni and chilli honey.", description: "Crisp-edged pepperoni cups, smoked mozzarella and a drizzle of chilli honey.", price: 1100, prepMinutes: 11, spicy: true, tags: ["Italian", "Pizza", "Spicy"] }),
  s({ id: "fettuccine-alfredo", cuisine: "italian", name: "Fettuccine Alfredo", line: "Butter, parmigiano, patience.", description: "Hand-cut ribbons tossed in butter and aged parmigiano until glossy, finished with black pepper.", price: 790, prepMinutes: 12, veg: true, tags: ["Italian", "Pasta", "Vegetarian", "Comfort food"] }),
  s({ id: "carbonara", cuisine: "italian", name: "Spaghetti Carbonara", line: "Guanciale, yolk, pecorino. No cream. Ever.", description: "Crisp guanciale, egg yolks emulsified off the heat with pecorino and pasta water, finished with black pepper.", price: 820, prepMinutes: 12, tags: ["Italian", "Pasta"], locked: true }),
  s({ id: "tiramisu", cuisine: "italian", name: "Tiramisu", line: "Espresso, mascarpone, cocoa.", description: "Savoiardi soaked in espresso, layered with whipped mascarpone and dusted with cocoa.", price: 450, prepMinutes: 3, veg: true, tags: ["Italian", "Dessert", "Vegetarian"] }),

  // ——— Chinese ———
  s({ id: "xiao-long-bao", cuisine: "chinese", name: "Xiao Long Bao", line: "Eighteen pleats. One burst of soup.", description: "Soup dumplings folded by hand, steamed in bamboo, served with black vinegar and ribbons of young ginger.", price: 680, prepMinutes: 12, tags: ["Chinese", "Signature", "Light"], locked: true }),
  s({ id: "kung-pao", cuisine: "chinese", name: "Kung Pao Chicken", line: "Peanuts, dried chilli, Sichuan pepper.", description: "Wok-tossed chicken with roasted peanuts, dried red chillies and a tingling hit of Sichuan pepper.", price: 720, prepMinutes: 12, spicy: true, tags: ["Chinese", "Spicy"] }),
  s({ id: "chilli-beef", cuisine: "chinese", name: "Szechuan Chilli Beef", line: "Crispy strips, sticky glaze.", description: "Beef cut into ribbons, fried until crisp and tossed in a sticky chilli glaze with sesame and spring onion.", price: 890, prepMinutes: 13, spicy: true, tags: ["Chinese", "Spicy"] }),
  s({ id: "egg-fried-rice", cuisine: "chinese", name: "Wok Egg Fried Rice", line: "Smoky wok hei in every grain.", description: "Day-old rice fried at full flame with egg and scallion until every grain separates.", price: 380, prepMinutes: 8, veg: true, tags: ["Chinese", "Rice", "Vegetarian"] }),
  s({ id: "hakka-noodles", cuisine: "chinese", name: "Hakka Noodles", line: "Stir-fried, crunchy, soy-slicked.", description: "Wok-fried noodles with cabbage, carrot and spring onion, glossy with soy.", price: 450, prepMinutes: 9, veg: true, tags: ["Chinese", "Noodles", "Vegetarian"] }),
  s({ id: "honey-chilli-cauli", cuisine: "chinese", name: "Honey Chilli Cauliflower", line: "Crackling florets, sweet heat.", description: "Battered cauliflower fried crisp and glazed with honey, chilli and toasted sesame.", price: 490, prepMinutes: 10, spicy: true, veg: true, tags: ["Chinese", "Spicy", "Vegetarian"] }),

  // ——— Burgers ———
  s({ id: "signature-smash", cuisine: "burgers", name: "The BiteME Smash", line: "Smashed hard. Stacked with intent.", description: "Two lace-edged beef patties, American cheese, pickles and house sauce in a toasted potato bun.", price: 690, prepMinutes: 10, tags: ["Burgers", "Signature"], locked: true }),
  s({ id: "double-trouble", cuisine: "burgers", name: "Double Trouble", line: "Two quarter-pounders, one bun.", description: "Two thick beef patties, melted cheddar, beef bacon and a crisp onion ring stacked in a brioche bun.", price: 890, prepMinutes: 12, tags: ["Burgers"] }),
  s({ id: "crispy-chicken", cuisine: "burgers", name: "Nashville Crispy Chicken", line: "Hot-fried, slaw-topped, loud.", description: "A hot-fried chicken thigh with slaw, pickles and spicy mayo in a brioche bun.", price: 590, prepMinutes: 11, spicy: true, tags: ["Burgers", "Spicy"] }),
  s({ id: "kacchi-burger", cuisine: "burgers", name: "Kacchi Beef Burger", line: "Only Dhaka could invent this.", description: "Kacchi-spiced beef, saffron mayo, fried onion and aloo crisps in a sesame brioche bun.", price: 790, prepMinutes: 12, tags: ["Burgers", "Signature", "New"] }),
  s({ id: "truffle-swiss", cuisine: "burgers", name: "Truffle Mushroom Swiss", line: "Earthy, melty, a little fancy.", description: "Sautéed mushrooms and melted Swiss over a beef patty with truffle aioli.", price: 820, prepMinutes: 12, tags: ["Burgers"] }),
  s({ id: "loaded-fries", cuisine: "burgers", name: "Loaded Fries", line: "Cheese sauce, jalapeño, beef crumble.", description: "Double-cooked fries buried under cheese sauce, jalapeño and crisp beef crumble.", price: 350, prepMinutes: 7, tags: ["Burgers", "Comfort food"] }),

  // ——— Drinks ———
  s({ id: "borhani", cuisine: "drinks", name: "Borhani", line: "The kacchi's best friend.", description: "A spiced mint-yogurt digestive, cold and sharp, made to follow a heavy plate of biryani.", price: 120, prepMinutes: 2, veg: true, tags: ["Drinks", "Deshi", "Vegetarian"] }),
  s({ id: "mango-lassi", cuisine: "drinks", name: "Rajshahi Mango Lassi", line: "Summer in a tall glass.", description: "Rajshahi mangoes blended with thick yogurt, cardamom and a thread of saffron.", price: 250, prepMinutes: 2, veg: true, tags: ["Drinks", "Vegetarian"], locked: true }),
  s({ id: "yuzu-soda", cuisine: "drinks", name: "Iced Yuzu Soda", line: "Bright, fizzy, cold.", description: "Yuzu, sparkling water, ice and a slice of lime.", price: 290, prepMinutes: 2, veg: true, tags: ["Drinks", "Japanese", "New", "Vegetarian"] }),
  s({ id: "masala-cha", cuisine: "drinks", name: "Dudh Cha", line: "Street-stall milk tea in a clay cup.", description: "Milk tea boiled strong and sweet, served the way the stalls do it — in a clay bhar.", price: 90, prepMinutes: 3, veg: true, tags: ["Drinks", "Deshi", "New", "Vegetarian"] }),
];

/** The full starting catalogue. The database copies this on first run, then the admin panel owns it. */
export const seedDishes: Dish[] = SEED.map((d, i) => ({
  ...d,
  image: `/menu/${d.id}.webp`,
  fit: "contain",
  available: true,
  hidden: false,
  order: i,
}));

/** Tag names in the order guests see them as filter buttons (until the admin reorders them). */
export const seedTags: string[] = ["Signature", "Spicy", "Vegetarian", "Seafood", "Rice", "Noodles", "Pasta", "Pizza", "Bread", "Light", "Comfort food", "Dessert", "New", ...cuisines.map((c) => c.name)];

/** The ten dishes the homepage table film rotates through, in film order. */
export const TABLE_DISH_IDS = ["kacchi-biryani", "ilish-bhapa", "tonkotsu-ramen", "salmon-nigiri", "butter-chicken", "margherita", "carbonara", "xiao-long-bao", "signature-smash", "mango-lassi"] as const;

export const formatBDT = (n: number) => `Tk ${n.toLocaleString("en-IN")}`;

export const cuisineName = (id: CuisineId) => cuisines.find((c) => c.id === id)?.name ?? "";

/** URL-safe id from a dish name. */
export const slugify = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
