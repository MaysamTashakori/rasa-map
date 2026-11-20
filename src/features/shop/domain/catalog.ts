import type { CoffeeItem } from "./types";

/**
 * Coffee menu — the "keep it free" support products.
 * Prices are in Iranian Tomans and shown to the customer before checkout.
 */
export const COFFEE_MENU: CoffeeItem[] = [
  {
    id: "espresso",
    nameKey: "shop.items.espresso.name",
    descKey: "shop.items.espresso.desc",
    priceToman: 99_000,
  },
  {
    id: "americano",
    nameKey: "shop.items.americano.name",
    descKey: "shop.items.americano.desc",
    priceToman: 149_000,
  },
  {
    id: "macchiato",
    nameKey: "shop.items.macchiato.name",
    descKey: "shop.items.macchiato.desc",
    priceToman: 249_000,
  },
];
