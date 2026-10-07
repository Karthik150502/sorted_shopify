import { Suspense } from "react";
import { CollectionProducts } from "./collection-products";

export default function CollectionProductsPage() {
  return (
    // The collection ID is only known at request time, so the page streams in.
    <Suspense>
      <CollectionProducts />
    </Suspense>
  );
}
