export type SortAlpha = "ascending" | "descending";

// Which products the rules reorder when some are pinned.
export type PinnedProductSort = "separately" | "unpinned-only" | "pinned-only";

export type Rules = {
  outOfStockToBottom: boolean;
  newestFirst: boolean;
  highestInventoryFirst: boolean;
  costliestFirst: boolean;
  // Null leaves products unsorted by title.
  sortAlphabetically: SortAlpha | null;
  pinnedProductsSortType: PinnedProductSort;
};

export const DEFAULT_RULES: Rules = {
  outOfStockToBottom: false,
  newestFirst: false,
  highestInventoryFirst: false,
  costliestFirst: false,
  sortAlphabetically: null,
  pinnedProductsSortType: "separately",
};
