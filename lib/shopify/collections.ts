import {
  shopifyMutation,
  shopifyQuery,
  type UserError,
} from "@/lib/shopify/graphql";

const PAGE_SIZE = 20;

export type Collection = {
  id: string;
  title: string;
  imageUrl: string | null;
  // Smart collections pick their products by rules; manual ones are hand-picked.
  type: "Smart" | "Manual";
  productsCount: number | null;
};

type CollectionsData = {
  collections: {
    nodes: {
      id: string;
      title: string;
      image: { url: string } | null;
      ruleSet: { appliedDisjunctively: boolean } | null;
      productsCount: { count: number } | null;
    }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

const COLLECTIONS_QUERY = `
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after, sortKey: TITLE) {
      nodes {
        id
        title
        image {
          url(transform: { maxWidth: 160, maxHeight: 160 })
        }
        ruleSet {
          appliedDisjunctively
        }
        productsCount {
          count
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

type CollectionData = {
  collection: { id: string; title: string } | null;
};

const COLLECTION_QUERY = `
  query Collection($id: ID!) {
    collection(id: $id) {
      id
      title
    }
  }
`;

// Returns null when the collection doesn't exist.
export async function getCollection(id: string) {
  const { collection } = await shopifyQuery<CollectionData>(COLLECTION_QUERY, {
    id,
  });
  return collection;
}

export async function getCollections(cursor: string | null) {
  const { collections } = await shopifyQuery<CollectionsData>(
    COLLECTIONS_QUERY,
    { first: PAGE_SIZE, after: cursor },
  );

  const items: Collection[] = collections.nodes.map((node) => ({
    id: node.id,
    title: node.title,
    imageUrl: node.image?.url ?? null,
    type: node.ruleSet ? "Smart" : "Manual",
    productsCount: node.productsCount?.count ?? null,
  }));

  return {
    items,
    nextCursor: collections.pageInfo.hasNextPage
      ? collections.pageInfo.endCursor
      : null,
  };
}

type CollectionSortOrderData = {
  collection: { sortOrder: string } | null;
};

type CollectionUpdateData = {
  collectionUpdate: { userErrors: UserError[] } | null;
};

const COLLECTION_SORT_ORDER_QUERY = `
  query CollectionSortOrder($id: ID!) {
    collection(id: $id) {
      sortOrder
    }
  }
`;

const SET_MANUAL_SORT_ORDER_MUTATION = `
  mutation SetManualSortOrder($id: ID!) {
    collectionUpdate(input: { id: $id, sortOrder: MANUAL }) {
      userErrors {
        field
        message
      }
    }
  }
`;

// Shopify only keeps a hand-picked product order on collections sorted
// manually, so this switches the collection to manual sorting if needed.
// Returns false when the collection doesn't exist.
export async function ensureManualSortOrder(id: string) {
  const { collection } = await shopifyQuery<CollectionSortOrderData>(
    COLLECTION_SORT_ORDER_QUERY,
    { id },
  );
  if (!collection) return false;

  if (collection.sortOrder !== "MANUAL") {
    await shopifyMutation<CollectionUpdateData>(
      SET_MANUAL_SORT_ORDER_MUTATION,
      { id },
    );
  }
  return true;
}
