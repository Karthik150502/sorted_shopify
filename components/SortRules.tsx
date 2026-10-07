"use client";

import { BlockStack, Box, Checkbox, Select, Text } from "@shopify/polaris";
import type { PinnedProductSort, Rules, SortAlpha } from "@/lib/types";

type SortRulesProps = {
  rules: Rules;
  onChange: (rules: Rules) => void;
};

const TOGGLES = [
  { key: "outOfStockToBottom", label: "Move out-of-stock products to the bottom" },
  { key: "newestFirst", label: "Newest products first" },
  { key: "highestInventoryFirst", label: "Highest inventory first" },
  { key: "costliestFirst", label: "Costliest products first" },
] as const;

const ALPHABETICAL_OPTIONS = [
  { label: "None", value: "" },
  { label: "A to Z", value: "ascending" },
  { label: "Z to A", value: "descending" },
];

const PINNED_OPTIONS = [
  { label: "Pinned and unpinned separately", value: "separately" },
  { label: "Unpinned products only", value: "unpinned-only" },
  { label: "Pinned products only", value: "pinned-only" },
];

export function SortRules({ rules, onChange }: SortRulesProps) {
  return (
    <Box padding="400">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Sorting rules
        </Text>
        <BlockStack gap="200">
          {TOGGLES.map(({ key, label }) => (
            <Checkbox
              key={key}
              label={label}
              checked={rules[key]}
              onChange={(checked) => onChange({ ...rules, [key]: checked })}
            />
          ))}
        </BlockStack>
        <Select
          label="Sort alphabetically"
          options={ALPHABETICAL_OPTIONS}
          value={rules.sortAlphabetically ?? ""}
          onChange={(value) =>
            onChange({
              ...rules,
              sortAlphabetically: value ? (value as SortAlpha) : null,
            })
          }
        />
        <Select
          label="Apply rules to"
          options={PINNED_OPTIONS}
          value={rules.pinnedProductsSortType}
          onChange={(value) =>
            onChange({
              ...rules,
              pinnedProductsSortType: value as PinnedProductSort,
            })
          }
        />
      </BlockStack>
    </Box>
  );
}
