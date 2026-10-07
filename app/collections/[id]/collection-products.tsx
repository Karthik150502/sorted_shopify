"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Banner,
  BlockStack,
  Card,
  EmptyState,
  InlineGrid,
  Page,
  Text,
} from "@shopify/polaris";
import { ConfirmModal } from "@/components/ConfirmModal";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ProductCardSkeleton } from "@/components/product-card";
import {
  ProductGrid,
  type ProductGridChanges,
} from "@/components/ProductGrid";
import { SortRules } from "@/components/SortRules";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { Product } from "@/lib/shopify/products";
import { DEFAULT_RULES } from "@/lib/types";
import styles from "./collection-products.module.css";

const GRID_COLUMNS = { xs: 2, sm: 3, lg: 4, xl: 5 };

export function CollectionProducts() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  // Changing the key remounts the grid, which discards its unsaved changes.
  const [gridKey, setGridKey] = useState(0);

  const collection = useApiQuery<{ title: string }>(`/api/collections/${id}`);
  const productsUrl = `/api/collections/${id}/products`;
  const { items, initialLoading, loading, hasMore, error, loadMore, retry } =
    useInfiniteScroll<Product>(productsUrl);
  // A successful save refetches the products, so the grid shows what Shopify
  // now has.
  const saveOrder = useApiMutation<unknown, { productIds: string[] }>(
    `/api/collections/${id}/order`,
    [productsUrl],
  );

  const collectionGid = `gid://shopify/Collection/${id}`;
  const pinsUrl = `/api/pins?collectionId=${encodeURIComponent(collectionGid)}`;
  const pins = useApiQuery<string[]>(pinsUrl);
  const savePins = useApiMutation<
    unknown,
    { collectionId: string; pinnedIds: string[] }
  >("/api/pins", [pinsUrl]);

  const saving = saveOrder.isPending || savePins.isPending;
  const saveError = saveOrder.error ?? savePins.error;
  const saved =
    !saving && !saveError && (saveOrder.isSuccess || savePins.isSuccess);

  // Order and pins are stored separately in Shopify, so only the part that
  // changed is written.
  function save({ products, pinnedIds }: ProductGridChanges) {
    saveOrder.reset();
    savePins.reset();
    if (products) {
      saveOrder.mutate({ productIds: products.map((product) => product.id) });
    }
    if (pinnedIds) {
      savePins.mutate({ collectionId: collectionGid, pinnedIds });
    }
  }

  function dismissSaveBanner() {
    saveOrder.reset();
    savePins.reset();
  }

  // Next.js keeps this page's state when navigating away, so the modal and
  // the unsaved changes are cleared explicitly before leaving.
  function leaveWithoutSaving() {
    setLeaveModalOpen(false);
    setGridKey((key) => key + 1);
    setRules(DEFAULT_RULES);
    router.push("/collections");
  }

  return (
    <div className={sidebarOpen ? styles.withSidebar : undefined}>
      <Page
        fullWidth
        title={collection.data?.title ?? "Collection"}
        backAction={
          hasUnsavedChanges
            ? { content: "Collections", onAction: () => setLeaveModalOpen(true) }
            : { content: "Collections", url: "/collections" }
        }
        secondaryActions={[
          {
            content: sidebarOpen ? "Hide sidebar" : "Show sidebar",
            onAction: () => setSidebarOpen((open) => !open),
          },
        ]}
      >
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <SortRules rules={rules} onChange={setRules} />
          </aside>
        )}
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
          {pins.error && (
            <Banner title="Pinned products couldn't be loaded" tone="critical">
              <p>{pins.error.message}</p>
            </Banner>
          )}
          {saveError && (
            <Banner
              title="Changes couldn't be saved"
              tone="critical"
              onDismiss={dismissSaveBanner}
            >
              <p>{saveError.message}</p>
            </Banner>
          )}
          {saved && (
            <Banner
              title="Changes saved"
              tone="success"
              onDismiss={dismissSaveBanner}
            />
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
              <ProductGrid
                key={gridKey}
                products={items}
                pinnedIds={pins.data}
                rules={rules}
                saving={saving}
                onSave={save}
                onReset={() => setRules(DEFAULT_RULES)}
                onUnsavedChange={setHasUnsavedChanges}
              />
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
      <ConfirmModal
        open={leaveModalOpen}
        title="Unsaved changes"
        confirmLabel="Yes"
        onConfirm={leaveWithoutSaving}
        onCancel={() => setLeaveModalOpen(false)}
      >
        <Text as="p">Exit page and don&apos;t save the reordered products?</Text>
      </ConfirmModal>
    </div>
  );
}
