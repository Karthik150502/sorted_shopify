"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/hooks/use-api";

export type InfiniteScrollPage<T> = {
  items: T[];
  // Cursor for the next page, or null when this is the last page.
  nextCursor: string | null;
};

// Loads `url` page by page, passing each page's cursor as a `cursor` search
// param. Loaded pages are cached under `url`.
export function useInfiniteScroll<T>(url: string) {
  const {
    data,
    error,
    isPending,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [url],
    queryFn: ({ pageParam }) => {
      const separator = url.includes("?") ? "&" : "?";
      return apiFetch<InfiniteScrollPage<T>>(
        pageParam
          ? `${url}${separator}cursor=${encodeURIComponent(pageParam)}`
          : url,
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  // After a failure, scrolling doesn't refetch; the caller retries explicitly.
  const loadMore = useCallback(() => {
    if (!error && hasNextPage && !isFetching) fetchNextPage();
  }, [error, hasNextPage, isFetching, fetchNextPage]);

  const retry = useCallback(() => {
    if (data) fetchNextPage();
    else refetch();
  }, [data, fetchNextPage, refetch]);

  return {
    items,
    initialLoading: isPending,
    loading: isFetching,
    // Until the first page has loaded there is no end to report yet.
    hasMore: hasNextPage || !data,
    error,
    loadMore,
    retry,
  };
}
