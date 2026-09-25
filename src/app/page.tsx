import Home, { type Films } from "@/components/film/Home";
import { film } from "@/lib/films";

export default async function Page() {
  const films: Films = {
    hero: await film("hero"),
    kacchi: await film("kacchi"),
    pizza: await film("pizza"),
    ramen: await film("ramen"),
    book: await film("book"),
  };
  return <Home films={films} />;
}
