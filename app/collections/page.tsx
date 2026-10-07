"use client";

import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Card,
  EmptyState,
  InlineStack,
  Page,
  ResourceItem,
  ResourceList,
  SkeletonBodyText,
  SkeletonThumbnail,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import { CollectionIcon } from "@shopify/polaris-icons";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { Collection } from "@/lib/shopify/collections";

function CollectionsSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        {Array.from({ length: 6 }, (_, index) => (
          <InlineStack key={index} gap="400" blockAlign="center" wrap={false}>
            <SkeletonThumbnail size="small" />
            <Box width="100%">
              <SkeletonBodyText lines={2} />
            </Box>
          </InlineStack>
        ))}
      </BlockStack>
    </Card>
  );
}

// ResourceList requires renderItem to return a ResourceItem directly.
function renderCollection(collection: Collection) {
  const { id, title, imageUrl, type, productsCount } = collection;

  return (
    <ResourceItem
      key={id}
      id={id}
      // Shopify IDs look like gid://shopify/Collection/123; the route uses 123.
      url={`/collections/${id.split("/").pop()}`}
      accessibilityLabel={`View products in ${title}`}
      media={
        <Thumbnail source={imageUrl ?? CollectionIcon} alt="" size="small" />
      }
    >
      <InlineStack align="space-between" blockAlign="center" gap="200">
        <BlockStack gap="050">
          <Text as="h3" variant="bodyMd" fontWeight="semibold">
            {title}
          </Text>
          {productsCount !== null && (
            <Text as="p" tone="subdued">
              {productsCount === 1 ? "1 product" : `${productsCount} products`}
            </Text>
          )}
        </BlockStack>
        <Badge>{type}</Badge>
      </InlineStack>
    </ResourceItem>
  );
}

export default function CollectionsPage() {
  const { items, initialLoading, loading, hasMore, error, loadMore, retry } =
    useInfiniteScroll<Collection>("/api/collections");

  return (
    <Page title="Collections" backAction={{ content: "Home", url: "/" }}>
      <BlockStack gap="400">
        {error && (
          <Banner
            title="Collections couldn't be loaded"
            tone="critical"
            action={{ content: "Try again", onAction: retry, loading }}
          >
            <p>{error.message}</p>
          </Banner>
        )}
        {initialLoading ? (
          <CollectionsSkeleton />
        ) : items.length > 0 ? (
          <InfiniteScroll
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
            endMessage="You've reached the end of your collections."
          >
            <Card padding="0">
              <ResourceList
                resourceName={{ singular: "collection", plural: "collections" }}
                items={items}
                renderItem={renderCollection}
              />
            </Card>
          </InfiniteScroll>
        ) : (
          !error && (
            <Card>
              <EmptyState
                heading="No collections yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Collections you create in Shopify will show up here.</p>
              </EmptyState>
            </Card>
          )
        )}
      </BlockStack>
    </Page>
  );
}
