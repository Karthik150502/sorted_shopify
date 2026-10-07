"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Banner,
  BlockStack,
  Card,
  EmptyState,
  InlineGrid,
  Page,
} from "@shopify/polaris";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { useApiQuery } from "@/hooks/use-api";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { Product } from "@/lib/shopify/products";
import styles from "./collection-products.module.css";

const GRID_COLUMNS = { xs: 2, sm: 3, lg: 4, xl: 5 };

export function CollectionProducts() {
  const { id } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const collection = useApiQuery<{ title: string }>(`/api/collections/${id}`);
  const { items, initialLoading, loading, hasMore, error, loadMore, retry } =
    useInfiniteScroll<Product>(`/api/collections/${id}/products`);

  return (
    <div className={sidebarOpen ? styles.withSidebar : undefined}>
      <Page
        fullWidth
        title={collection.data?.title ?? "Collection"}
        backAction={{ content: "Collections", url: "/collections" }}
        secondaryActions={[
          {
            content: sidebarOpen ? "Hide sidebar" : "Show sidebar",
            onAction: () => setSidebarOpen((open) => !open),
          },
        ]}
      >
        {sidebarOpen && <aside className={styles.sidebar} />}
        <BlockStack gap="400">
          {error && (
            <Banner
              title="Products couldn't be loaded"
              tone="critical"
              action={{ content: "Try again", onAction: retry, loading }}
            >
              <p>{error.message}</p>
            </Banner>
          )}
          {initialLoading ? (
            <InlineGrid columns={GRID_COLUMNS} gap="400">
              {Array.from({ length: 10 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </InlineGrid>
          ) : items.length > 0 ? (
            <InfiniteScroll
              hasMore={hasMore}
              loading={loading}
              onLoadMore={loadMore}
              endMessage="You've reached the end of this collection."
            >
              <InlineGrid columns={GRID_COLUMNS} gap="400">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </InlineGrid>
            </InfiniteScroll>
          ) : (
            !error && (
              <Card>
                <EmptyState
                  heading="No products in this collection"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Products you add to this collection will show up here.</p>
                </EmptyState>
              </Card>
            )
          )}
        </BlockStack>
      </Page>
    </div>
  );
}
