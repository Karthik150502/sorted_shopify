"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Calls one of this app's API routes. Failed responses are expected to carry
// an `{ error: string }` body, which becomes the thrown error's message.
export async function apiFetch<TData>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return body as TData;
}

// GETs `url` and caches the result under it, so components asking for the
// same URL share one request.
export function useApiQuery<TData>(url: string) {
  return useQuery({
    queryKey: [url],
    queryFn: () => apiFetch<TData>(url),
  });
}

// POSTs the mutation variables to `url` as JSON. On success, cached queries
// for the URLs in `invalidates` are refetched.
export function useApiMutation<TData, TVariables>(
  url: string,
  invalidates: string[] = [],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) =>
      apiFetch<TData>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      }),
    onSuccess: () =>
      Promise.all(
        invalidates.map((queryUrl) =>
          queryClient.invalidateQueries({ queryKey: [queryUrl] }),
        ),
      ),
  });
}
