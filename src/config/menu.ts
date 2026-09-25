export type CuisineId = "deshi" | "japanese" | "indian" | "italian" | "chinese" | "burgers" | "drinks";

export type Cuisine = { id: CuisineId; name: string };

export type MenuItem = {
  id: string;
  cuisine: CuisineId;
  name: string;
  /** One punchy line for the book page. */
  line: string;
  description: string;
  price: number; // BDT
  prepMinutes: number;
  spicy?: boolean;
  veg?: boolean;
};

export const cuisines: Cuisine[] = [
  { id: "deshi", name: "Deshi" },
  { id: "japanese", name: "Japanese" },
  { id: "indian", name: "Indian" },
  { id: "italian", name: "Italian" },
  { id: "chinese", name: "Chinese" },
  { id: "burgers", name: "Burgers" },
  { id: "drinks", name: "Drinks" },
];

/** Ten dishes — each gets its own page in the menu book. */
export const menu: MenuItem[] = [
  {
    id: "kacchi-biryani",
    cuisine: "deshi",
    name: "Old Dhaka Kacchi",
    line: "Sealed in dough. Opened at your table.",
    description: "Mutton and aged basmati layered in a copper handi, dum-cooked for three hours with saffron, ghee and a golden aloo.",
    price: 750,
    prepMinutes: 18,
  },
  {
    id: "ilish-bhapa",
    cuisine: "deshi",
    name: "Shorshe Ilish",
    line: "Padma hilsa, sharp mustard, banana leaf.",
    description: "Hilsa steaks steamed in a pungent mustard-green-chilli paste, the way every Bengali grandmother insists it should be.",
    price: 1200,
    prepMinutes: 22,
    spicy: true,
  },
  {
    id: "tonkotsu-ramen",
    cuisine: "japanese",
    name: "Tonkotsu Ramen",
    line: "Eighteen hours of broth in every spoon.",
    description: "Pork-bone broth simmered overnight, chashu, a jammy soy egg, nori and fresh noodles pulled to order.",
    price: 950,
    prepMinutes: 12,
  },
  {
    id: "salmon-nigiri",
    cuisine: "japanese",
    name: "Salmon Nigiri",
    line: "Six pieces. Hand-pressed. Never rushed.",
    description: "Norwegian salmon over body-temperature shari, brushed with nikiri, pickled ginger and fresh wasabi on the side.",
    price: 890,
    prepMinutes: 10,
  },
  {
    id: "butter-chicken",
    cuisine: "indian",
    name: "Butter Chicken",
    line: "Tandoor smoke, tomato silk, cold butter.",
    description: "Chicken charred in a 480° tandoor, folded into a makhani of tomatoes, fenugreek and a stubborn amount of butter.",
    price: 780,
    prepMinutes: 15,
  },
  {
    id: "margherita",
    cuisine: "italian",
    name: "Margherita",
    line: "Ninety seconds at 450°. Leopard spots included.",
    description: "Forty-eight-hour dough, San Marzano tomato, fior di latte and basil — fired in a wood dome until it blisters.",
    price: 850,
    prepMinutes: 10,
    veg: true,
  },
  {
    id: "carbonara",
    cuisine: "italian",
    name: "Spaghetti Carbonara",
    line: "Guanciale, yolk, pecorino. No cream. Ever.",
    description: "Crisp guanciale, egg yolks emulsified off the heat with pecorino and pasta water, finished with black pepper.",
    price: 820,
    prepMinutes: 12,
  },
  {
    id: "xiao-long-bao",
    cuisine: "chinese",
    name: "Xiao Long Bao",
    line: "Eighteen pleats. One burst of soup.",
    description: "Soup dumplings folded by hand, steamed in bamboo, served with black vinegar and ribbons of young ginger.",
    price: 680,
    prepMinutes: 12,
  },
  {
    id: "signature-smash",
    cuisine: "burgers",
    name: "The BiteME Smash",
    line: "Smashed hard. Stacked with intent.",
    description: "Two lace-edged beef patties, American cheese, pickles and house sauce in a toasted potato bun.",
    price: 690,
    prepMinutes: 10,
  },
  {
    id: "mango-lassi",
    cuisine: "drinks",
    name: "Rajshahi Mango Lassi",
    line: "Summer in a tall glass.",
    description: "Rajshahi mangoes blended with thick yogurt, cardamom and a thread of saffron.",
    price: 250,
    prepMinutes: 2,
    veg: true,
  },
];

export const formatBDT = (n: number) => `Tk ${n.toLocaleString("en-IN")}`;

export const getItem = (id: string) => menu.find((m) => m.id === id);

export const cuisineName = (id: CuisineId) => cuisines.find((c) => c.id === id)?.name ?? "";
