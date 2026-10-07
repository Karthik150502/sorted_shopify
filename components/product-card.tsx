import {
  Badge,
  BlockStack,
  Box,
  Card,
  Icon,
  SkeletonBodyText,
  Text,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import type { Product } from "@/lib/shopify/products";
import styles from "./product-card.module.css";

const STATUS_BADGES = {
  ACTIVE: { tone: "success", label: "Active" },
  DRAFT: { tone: "info", label: "Draft" },
  ARCHIVED: { tone: undefined, label: "Archived" },
  UNLISTED: { tone: undefined, label: "Unlisted" },
} as const;

export function formatPrice({ min, max, currencyCode }: Product["price"]) {
  const price = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(min));

  return min === max ? price : `From ${price}`;
}

function inventoryLabel(inventory: Product["inventory"]) {
  if (inventory === null) return "Inventory not tracked";
  return inventory > 0 ? `${inventory} in stock` : "Out of stock";
}

export function ProductCard({ product }: { product: Product }) {
  const { title, imageUrl, status, inventory, price } = product;
  const badge = STATUS_BADGES[status];

  return (
    <Card padding="0">
      <div className={styles.media}>
        {imageUrl ? (
          // Shopify's CDN already serves the image at the size requested.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className={styles.image}
          />
        ) : (
          <Icon source={ImageIcon} tone="subdued" />
        )}
      </div>
      <Box padding="300">
        <BlockStack gap="150" inlineAlign="start">
          <Text as="h3" variant="bodyMd" fontWeight="semibold" truncate>
            {title}
          </Text>
          <Text as="p" variant="bodyMd">
            {formatPrice(price)}
          </Text>
          <Text
            as="p"
            variant="bodySm"
            tone={inventory === 0 ? "critical" : "subdued"}
          >
            {inventoryLabel(inventory)}
          </Text>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </BlockStack>
      </Box>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card padding="0">
      <div className={styles.mediaSkeleton} />
      <Box padding="300">
        <SkeletonBodyText lines={3} />
      </Box>
    </Card>
  );
}
