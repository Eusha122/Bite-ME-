export type CuisineId =
  | "deshi"
  | "japanese"
  | "indian"
  | "italian"
  | "chinese"
  | "burgers"
  | "drinks";

export type Cuisine = {
  id: CuisineId;
  name: string;
  bn: string;
  tagline: string;
  accent: string;
};

export type MenuItem = {
  id: string;
  cuisine: CuisineId;
  name: string;
  description: string;
  price: number; // BDT
  tags?: ("spicy" | "veg" | "signature" | "new" | "chef")[];
  prepMinutes: number;
  /** Photographic prompt used to generate the dish image (kept for regeneration). */
  shot: string;
};

export const cuisines: Cuisine[] = [
  { id: "deshi", name: "Deshi", bn: "দেশি", tagline: "Where it all began", accent: "#f2a33a" },
  { id: "japanese", name: "Japanese", bn: "জাপানি", tagline: "Precision, in silence", accent: "#ff4f7b" },
  { id: "indian", name: "Indian", bn: "ভারতীয়", tagline: "Slow fire, loud spice", accent: "#ff8a1f" },
  { id: "italian", name: "Italian", bn: "ইতালিয়ান", tagline: "Ninety seconds at 450°", accent: "#e8402a" },
  { id: "chinese", name: "Chinese", bn: "চাইনিজ", tagline: "Breath of the wok", accent: "#e5283c" },
  { id: "burgers", name: "Burgers", bn: "বার্গার", tagline: "Stacked with intent", accent: "#ffc53d" },
  { id: "drinks", name: "Drinks", bn: "পানীয়", tagline: "To wash it all down", accent: "#6fd3b8" },
];

export const menu: MenuItem[] = [
  // ——— Deshi ———
  { id: "kacchi-biryani", cuisine: "deshi", name: "Old Dhaka Kacchi", description: "Mutton and aromatic rice sealed in a handi, dum-cooked for three hours with saffron and aloo.", price: 750, tags: ["signature", "chef"], prepMinutes: 18, shot: "a traditional Old Dhaka mutton kacchi biryani in a small copper handi, saffron-tinted long grain rice, tender mutton pieces, a golden potato, fried onions" },
  { id: "beef-tehari", cuisine: "deshi", name: "Beef Tehari", description: "Mustard-oil rice, tender beef, green chilli — the Puran Dhaka street classic.", price: 480, tags: ["spicy"], prepMinutes: 14, shot: "Bangladeshi beef tehari rice on a brass plate, yellow mustard-oil rice with beef chunks and whole green chillies" },
  { id: "ilish-bhapa", cuisine: "deshi", name: "Shorshe Ilish Bhapa", description: "Padma hilsa steamed in a sharp mustard paste, served on banana leaf.", price: 1200, tags: ["chef"], prepMinutes: 22, shot: "Bengali shorshe ilish, hilsa fish steaks in bright yellow mustard gravy on a green banana leaf in a clay dish, green chillies" },
  { id: "chicken-rezala", cuisine: "deshi", name: "Chicken Rezala", description: "Ivory yogurt-cashew gravy, kewra and dried chilli. Mughal-era Dhaka.", price: 650, prepMinutes: 16, shot: "Bengali chicken rezala, creamy white gravy with chicken and dried red chillies in a white ceramic bowl" },
  { id: "morog-polao", cuisine: "deshi", name: "Morog Polao", description: "Wedding-style chicken polao with ghee, raisins and boiled egg.", price: 560, prepMinutes: 15, shot: "Bangladeshi morog polao, fragrant white rice with a chicken leg quarter, boiled egg and fried onions on a ceramic plate" },
  { id: "mishti-doi", cuisine: "deshi", name: "Bogura Mishti Doi", description: "Caramelised sweet yogurt set in a clay pot.", price: 180, tags: ["veg"], prepMinutes: 2, shot: "Bangladeshi mishti doi, caramel-brown sweet yogurt in an unglazed terracotta clay pot, one spoonful scooped" },

  // ——— Japanese ———
  { id: "salmon-nigiri", cuisine: "japanese", name: "Salmon Nigiri (6 pc)", description: "Norwegian salmon over hand-pressed shari, brushed with nikiri.", price: 890, prepMinutes: 10, shot: "six pieces of glistening salmon nigiri sushi on a dark wooden geta board with pickled ginger and wasabi" },
  { id: "dragon-roll", cuisine: "japanese", name: "Dragon Roll", description: "Prawn tempura inside, avocado scales outside, unagi glaze and tobiko.", price: 1150, tags: ["signature"], prepMinutes: 12, shot: "a dragon sushi roll topped with thin fanned avocado slices, eel sauce drizzle and orange tobiko on a long black plate" },
  { id: "tonkotsu-ramen", cuisine: "japanese", name: "Tonkotsu Ramen", description: "18-hour pork bone broth, chashu, ajitama egg, nori, scallion.", price: 950, tags: ["chef"], prepMinutes: 12, shot: "a steaming bowl of tonkotsu ramen with creamy broth, chashu pork slices, a halved soy-marinated soft egg, nori and scallions in a black ceramic bowl" },
  { id: "katsu-curry", cuisine: "japanese", name: "Chicken Katsu Curry", description: "Panko-crusted chicken, velvet Japanese curry, sticky rice.", price: 820, prepMinutes: 14, shot: "Japanese chicken katsu curry, sliced golden panko chicken cutlet over white rice with thick brown curry sauce in a wide shallow bowl" },
  { id: "prawn-tempura", cuisine: "japanese", name: "Prawn Tempura", description: "Tiger prawns in a lace-light batter, tentsuyu dip.", price: 980, prepMinutes: 10, shot: "four crispy golden prawn tempura pieces on washi paper in a bamboo basket with a small bowl of dipping sauce" },
  { id: "matcha-mochi", cuisine: "japanese", name: "Matcha Mochi", description: "Soft mochi, ceremonial matcha, red bean heart.", price: 390, tags: ["veg"], prepMinutes: 3, shot: "three green matcha mochi daifuku, one cut in half showing red bean filling, on a small grey ceramic plate dusted with matcha powder" },

  // ——— Indian ———
  { id: "butter-chicken", cuisine: "indian", name: "Butter Chicken", description: "Tandoor-charred chicken in a silky tomato-butter makhani.", price: 780, tags: ["signature"], prepMinutes: 15, shot: "Indian butter chicken in a hammered copper kadai, glossy orange makhani gravy with a swirl of cream and coriander" },
  { id: "rogan-josh", cuisine: "indian", name: "Mutton Rogan Josh", description: "Kashmiri chilli, fennel and slow-braised mutton.", price: 980, tags: ["spicy"], prepMinutes: 18, shot: "Kashmiri mutton rogan josh, deep red oily gravy with tender mutton pieces in a brass bowl" },
  { id: "paneer-tikka", cuisine: "indian", name: "Paneer Tikka", description: "Charred cottage cheese, peppers and onion from the tandoor.", price: 620, tags: ["veg"], prepMinutes: 12, shot: "charred paneer tikka cubes with bell peppers and onions on metal skewers on a slate board with mint chutney" },
  { id: "dum-biryani", cuisine: "indian", name: "Hyderabadi Dum Biryani", description: "Layered chicken biryani with mint, saffron and fried onion.", price: 690, tags: ["spicy"], prepMinutes: 16, shot: "Hyderabadi chicken dum biryani in a clay pot with layered saffron rice, chicken pieces, mint leaves and a small bowl of raita" },
  { id: "garlic-naan", cuisine: "indian", name: "Garlic Naan", description: "Blistered in the tandoor, brushed with garlic butter.", price: 120, tags: ["veg"], prepMinutes: 5, shot: "a blistered garlic butter naan bread with charred spots, torn in half, on a wooden board" },
  { id: "dal-makhani", cuisine: "indian", name: "Dal Makhani", description: "Black lentils simmered overnight with cream and butter.", price: 420, tags: ["veg"], prepMinutes: 8, shot: "creamy dark dal makhani in a small copper bowl with a swirl of cream and a pat of melting butter" },

  // ——— Italian ———
  { id: "margherita", cuisine: "italian", name: "Margherita Napoletana", description: "San Marzano, fior di latte, basil — 90 seconds in a 450° oven.", price: 850, tags: ["veg", "signature"], prepMinutes: 10, shot: "a whole Neapolitan margherita pizza with leopard-spotted puffy charred crust, San Marzano tomato, melted fior di latte and fresh basil" },
  { id: "truffle-pizza", cuisine: "italian", name: "Truffle Funghi", description: "Wild mushrooms, truffle cream, parmigiano, thyme.", price: 1250, tags: ["chef"], prepMinutes: 11, shot: "a whole Neapolitan white pizza with wild mushrooms, truffle cream, shaved parmesan and thyme, charred puffy crust" },
  { id: "pepperoni-inferno", cuisine: "italian", name: "Pepperoni Inferno", description: "Cupped pepperoni, chilli honey, smoked mozzarella.", price: 1100, tags: ["spicy"], prepMinutes: 11, shot: "a whole pizza with crispy cupped pepperoni, drizzled with chilli honey, bubbling mozzarella, charred crust" },
  { id: "fettuccine-alfredo", cuisine: "italian", name: "Fettuccine Alfredo", description: "Hand-cut ribbons, butter, aged parmigiano.", price: 790, tags: ["veg"], prepMinutes: 12, shot: "a twirled nest of creamy fettuccine alfredo with black pepper and grated parmesan in a white pasta bowl" },
  { id: "carbonara", cuisine: "italian", name: "Spaghetti Carbonara", description: "Guanciale, egg yolk, pecorino, black pepper. No cream. Ever.", price: 820, prepMinutes: 12, shot: "spaghetti carbonara twirled in a shallow bowl with crispy guanciale pieces, glossy egg yolk sauce and cracked black pepper" },
  { id: "tiramisu", cuisine: "italian", name: "Tiramisu", description: "Espresso-soaked savoiardi, mascarpone, cocoa.", price: 450, tags: ["veg"], prepMinutes: 3, shot: "a square slice of layered tiramisu with dusted cocoa on a small plate showing espresso-soaked sponge layers" },

  // ——— Chinese ———
  { id: "xiao-long-bao", cuisine: "chinese", name: "Xiao Long Bao", description: "Soup dumplings, 18 folds each, ginger-black vinegar.", price: 680, tags: ["signature"], prepMinutes: 12, shot: "six xiao long bao soup dumplings with delicate pleats in a round bamboo steamer, a small dish of black vinegar with ginger" },
  { id: "kung-pao", cuisine: "chinese", name: "Kung Pao Chicken", description: "Wok-tossed chicken, peanuts, Sichuan pepper, dried chilli.", price: 720, tags: ["spicy"], prepMinutes: 12, shot: "kung pao chicken with roasted peanuts, dried red chillies and scallions glossy in a dark bowl" },
  { id: "chilli-beef", cuisine: "chinese", name: "Szechuan Chilli Beef", description: "Crispy beef ribbons, chilli glaze, sesame.", price: 890, tags: ["spicy", "chef"], prepMinutes: 13, shot: "crispy Szechuan chilli beef strips in a sticky red chilli glaze with sesame seeds and spring onions on a black plate" },
  { id: "egg-fried-rice", cuisine: "chinese", name: "Wok Egg Fried Rice", description: "Smoky wok hei, egg, scallion.", price: 380, tags: ["veg"], prepMinutes: 8, shot: "a dome of egg fried rice with scallions and golden egg bits in a white porcelain bowl" },
  { id: "hakka-noodles", cuisine: "chinese", name: "Hakka Noodles", description: "Stir-fried noodles with crunchy vegetables and soy.", price: 450, tags: ["veg"], prepMinutes: 9, shot: "hakka noodles stir fried with julienned vegetables, cabbage, carrot and spring onion lifted with chopsticks from a bowl" },
  { id: "honey-chilli-cauli", cuisine: "chinese", name: "Honey Chilli Cauliflower", description: "Crackling florets, honey, chilli, toasted sesame.", price: 490, tags: ["veg", "spicy"], prepMinutes: 10, shot: "crispy honey chilli cauliflower florets glazed and sprinkled with sesame seeds and spring onion in a ceramic bowl" },

  // ——— Burgers ———
  { id: "signature-smash", cuisine: "burgers", name: "The BiteME Smash", description: "Double smashed beef, American cheese, house sauce, pickles, potato bun.", price: 690, tags: ["signature"], prepMinutes: 10, shot: "a juicy double smash burger with lacy crispy beef patties, melted American cheese, pickles and sauce in a glossy toasted potato bun" },
  { id: "double-trouble", cuisine: "burgers", name: "Double Trouble", description: "Two quarter-pound patties, bacon jam, cheddar, onion rings.", price: 890, prepMinutes: 12, shot: "a tall double cheeseburger with thick beef patties, melted cheddar, beef bacon and a crispy onion ring stacked high in a brioche bun" },
  { id: "crispy-chicken", cuisine: "burgers", name: "Nashville Crispy Chicken", description: "Hot-fried chicken thigh, slaw, pickles, spicy mayo.", price: 590, tags: ["spicy"], prepMinutes: 11, shot: "a Nashville hot fried chicken burger with a huge crunchy red-spiced fried chicken fillet, coleslaw and pickles in a brioche bun" },
  { id: "kacchi-burger", cuisine: "burgers", name: "Kacchi Beef Burger", description: "Our Dhaka twist: kacchi-spiced beef, saffron mayo, fried onion, aloo crisps.", price: 790, tags: ["new", "chef"], prepMinutes: 12, shot: "a gourmet beef burger with a spiced patty, saffron-yellow mayo, crispy fried onions and thin potato crisps in a sesame brioche bun" },
  { id: "truffle-swiss", cuisine: "burgers", name: "Truffle Mushroom Swiss", description: "Sautéed mushrooms, Swiss, truffle aioli.", price: 820, prepMinutes: 12, shot: "a mushroom swiss burger with sautéed mushrooms and melted swiss cheese dripping over a beef patty in a dark brioche bun" },
  { id: "loaded-fries", cuisine: "burgers", name: "Loaded Fries", description: "Double-cooked fries, cheese sauce, jalapeño, beef crumble.", price: 350, prepMinutes: 7, shot: "loaded french fries covered in melted cheese sauce, jalapeño slices and beef crumble in a paper-lined metal basket" },

  // ——— Drinks ———
  { id: "borhani", cuisine: "drinks", name: "Borhani", description: "Spiced mint-yogurt digestive, the kacchi's best friend.", price: 120, tags: ["veg"], prepMinutes: 2, shot: "a tall glass of Bangladeshi borhani, pale green spiced mint yogurt drink with a mint sprig, condensation on the glass" },
  { id: "mango-lassi", cuisine: "drinks", name: "Mango Lassi", description: "Rajshahi mango, yogurt, cardamom.", price: 250, tags: ["veg"], prepMinutes: 2, shot: "a thick golden mango lassi in a tall glass topped with a pinch of saffron and crushed pistachio" },
  { id: "yuzu-soda", cuisine: "drinks", name: "Iced Yuzu Soda", description: "Yuzu, sparkling water, a slice of lime.", price: 290, tags: ["veg", "new"], prepMinutes: 2, shot: "a sparkling iced yuzu soda in a clear highball glass with ice cubes, bubbles and a lime wheel" },
  { id: "masala-cha", cuisine: "drinks", name: "Dudh Cha", description: "Street-stall milk tea, boiled strong, served in a clay bhar.", price: 90, tags: ["veg"], prepMinutes: 3, shot: "steaming milky tea in a small unglazed terracotta clay cup (bhar)" },
];

export const formatBDT = (n: number) => `৳${n.toLocaleString("en-IN")}`;

export const getItem = (id: string) => menu.find((m) => m.id === id);
