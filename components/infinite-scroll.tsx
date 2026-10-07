"use client";

import { useEffect, useRef } from "react";
import { Box, InlineStack, Spinner, Text } from "@shopify/polaris";

type InfiniteScrollProps = {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  endMessage?: string;
  children: React.ReactNode;
};

export function InfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  endMessage,
  children,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    // Start loading shortly before the end of the list scrolls into view.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} />
      {loading && (
        <Box padding="400">
          <InlineStack align="center">
            <Spinner accessibilityLabel="Loading more" size="small" />
          </InlineStack>
        </Box>
      )}
      {!hasMore && endMessage && (
        <Box padding="400">
          <Text as="p" tone="subdued" alignment="center">
            {endMessage}
          </Text>
        </Box>
      )}
    </>
  );
}
