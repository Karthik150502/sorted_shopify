import { shopifyQuery } from "@/lib/shopify/graphql";

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
