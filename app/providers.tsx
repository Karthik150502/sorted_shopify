"use client";

import { useState } from "react";
import Link from "next/link";
import { AppProvider, type AppProviderProps } from "@shopify/polaris";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import enTranslations from "@shopify/polaris/locales/en.json";

type PolarisLinkProps = React.ComponentProps<
  NonNullable<AppProviderProps["linkComponent"]>
>;

// Makes Polaris links and `url` buttons navigate with the Next.js router.
function PolarisLink({ url, external, children, ...rest }: PolarisLinkProps) {
  return (
    <Link href={url} target={external ? "_blank" : undefined} {...rest}>
      {children}
    </Link>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Cached data is reused for 5 minutes before it is refetched. The
          // server already retries Shopify requests, so failures surface
          // immediately here.
          queries: { staleTime: 5 * 60 * 1000, retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider i18n={enTranslations} linkComponent={PolarisLink}>
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
}
