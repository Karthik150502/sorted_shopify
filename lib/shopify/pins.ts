import {
  shopifyMutation,
  shopifyQuery,
  type UserError,
} from "@/lib/shopify/graphql";

// Pinned product IDs are stored on the collection itself, as a JSON metafield.
const NAMESPACE = "custom";
const KEY = "pinned_products";

type PinnedProductsData = {
  collection: { metafield: { value: string } | null } | null;
};

type MetafieldsSetData = {
  metafieldsSet: { userErrors: UserError[] } | null;
};

const PINNED_PRODUCTS_QUERY = `
  query PinnedProducts($id: ID!, $namespace: String!, $key: String!) {
    collection(id: $id) {
      metafield(namespace: $namespace, key: $key) {
        value
      }
    }
  }
`;

const SET_PINNED_PRODUCTS_MUTATION = `
  mutation SetPinnedProducts($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors {
        field
        message
      }
    }
  }
`;

// Returns the collection's pinned product IDs, or null when the collection
// doesn't exist.
export async function getPinnedProductIds(collectionId: string) {
  const { collection } = await shopifyQuery<PinnedProductsData>(
    PINNED_PRODUCTS_QUERY,
    { id: collectionId, namespace: NAMESPACE, key: KEY },
  );
  if (!collection) return null;
  if (!collection.metafield) return [];

  // The value can be edited by hand in Shopify admin, so don't trust its shape.
  const value: unknown = JSON.parse(collection.metafield.value);
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string")
    : [];
}

// Replaces the collection's pinned product IDs. Validation failures from
// Shopify throw a ShopifyUserError.
export async function setPinnedProductIds(
  collectionId: string,
  pinnedIds: string[],
) {
  await shopifyMutation<MetafieldsSetData>(SET_PINNED_PRODUCTS_MUTATION, {
    metafields: [
      {
        ownerId: collectionId,
        namespace: NAMESPACE,
        key: KEY,
        type: "json",
        value: JSON.stringify(pinnedIds),
      },
    ],
  });
}
