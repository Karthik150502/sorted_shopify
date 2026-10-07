import type { Product } from "@/lib/shopify/products";
import type { Rules } from "@/lib/types";

// Missing or invalid dates sort as the oldest.
function createdTime(product: Product) {
  return Date.parse(product.createdAt) || 0;
}

// Negative when `a` should come before `b`. Enabled rules are tried in
// priority order, each one only breaking ties left by the ones before it.
function compare(a: Product, b: Product, rules: Rules) {
  if (rules.newestFirst) {
    const difference = createdTime(b) - createdTime(a);
    if (difference) return difference;
  }
  if (rules.highestInventoryFirst) {
    const difference = (b.inventory ?? 0) - (a.inventory ?? 0);
    if (difference) return difference;
  }
  if (rules.costliestFirst) {
    const difference = Number(b.price.min) - Number(a.price.min);
    if (difference) return difference;
  }
  if (rules.sortAlphabetically) {
    const difference = a.title.localeCompare(b.title);
    if (difference) {
      return rules.sortAlphabetically === "ascending"
        ? difference
        : -difference;
    }
  }
  return 0;
}

// Shopify inventory can go negative; untracked products are never out of stock.
function isOutOfStock(product: Product) {
  return product.inventory !== null && product.inventory <= 0;
}

function sortGroup(group: Product[], rules: Rules) {
  // Array.prototype.sort is stable, so ties keep their current order.
  const sorted = [...group].sort((a, b) => compare(a, b, rules));
  if (!rules.outOfStockToBottom) return sorted;

  return [
    ...sorted.filter((product) => !isOutOfStock(product)),
    ...sorted.filter(isOutOfStock),
  ];
}

// Returns the products in the order the rules produce, without changing the
// input. Pinned products always come first; `pinnedProductsSortType` decides
// whether the rules reorder the pinned group, the unpinned group, or each of
// them within itself.
export function applyRules(
  products: Product[],
  rules: Rules,
  pinnedIds: string[],
): Product[] {
  const pinned = products.filter((product) => pinnedIds.includes(product.id));
  const unpinned = products.filter(
    (product) => !pinnedIds.includes(product.id),
  );
  const sortType = rules.pinnedProductsSortType;

  return [
    ...(sortType === "unpinned-only" ? pinned : sortGroup(pinned, rules)),
    ...(sortType === "pinned-only" ? unpinned : sortGroup(unpinned, rules)),
  ];
}
