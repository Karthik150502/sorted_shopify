import { ensureManualSortOrder } from "@/lib/shopify/collections";
import {
  shopifyMutation,
  shopifyQuery,
  type UserError,
} from "@/lib/shopify/graphql";

const PAGE_SIZE = 24;

export type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT" | "UNLISTED";
  // Null when Shopify doesn't track inventory for the product.
  inventory: number | null;
  price: { min: string; max: string; currencyCode: string };
};

type CollectionProductsData = {
  collection: {
    products: {
      nodes: {
        id: string;
        title: string;
        status: Product["status"];
        tracksInventory: boolean;
        totalInventory: number;
        featuredMedia: {
          preview: { image: { url: string } | null } | null;
        } | null;
        priceRangeV2: {
          minVariantPrice: { amount: string; currencyCode: string };
          maxVariantPrice: { amount: string };
        };
      }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
};

// Without a sort key, products come back in the collection's own order.
const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($id: ID!, $first: Int!, $after: String) {
    collection(id: $id) {
      products(first: $first, after: $after) {
        nodes {
          id
          title
          status
          tracksInventory
          totalInventory
          featuredMedia {
            preview {
              image {
                url(transform: { maxWidth: 480, maxHeight: 480 })
              }
            }
          }
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        } 
      }
    }
  }
`;

// Returns null when the collection doesn't exist.
export async function getCollectionProducts(
  collectionId: string,
  cursor: string | null,
) {
  const { collection } = await shopifyQuery<CollectionProductsData>(
    COLLECTION_PRODUCTS_QUERY,
    { id: collectionId, first: PAGE_SIZE, after: cursor },
  );
  if (!collection) return null;

  const { nodes, pageInfo } = collection.products;
  const items: Product[] = nodes.map((node) => ({
    id: node.id,
    title: node.title,
    imageUrl: node.featuredMedia?.preview?.image?.url ?? null,
    status: node.status,
    inventory: node.tracksInventory ? node.totalInventory : null,
    price: {
      min: node.priceRangeV2.minVariantPrice.amount,
      max: node.priceRangeV2.maxVariantPrice.amount,
      currencyCode: node.priceRangeV2.minVariantPrice.currencyCode,
    },
  }));

  return {
    items,
    nextCursor: pageInfo.hasNextPage ? pageInfo.endCursor : null,
  };
}

export type ProductMove = {
  productId: string;
  // Zero-based position the product should end up at in the collection.
  newPosition: number;
};

type ReorderProductsData = {
  collectionReorderProducts: {
    job: { id: string } | null;
    userErrors: UserError[];
  } | null;
};

const REORDER_PRODUCTS_MUTATION = `
  mutation ReorderProducts($id: ID!, $moves: [MoveInput!]!) {
    collectionReorderProducts(id: $id, moves: $moves) {
      job {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Moves products to new positions in a collection. Shopify applies the moves
// in order, accepts at most 250 per call, and only reorders collections whose
// sort order is manual; anything else throws a ShopifyUserError. The reorder
// itself runs as a background job in Shopify, whose ID is returned.
export async function updateProductOrder(
  collectionId: string,
  moves: ProductMove[],
) {
  const { collectionReorderProducts } =
    await shopifyMutation<ReorderProductsData>(REORDER_PRODUCTS_MUTATION, {
      id: collectionId,
      // Shopify expects positions as strings (UnsignedInt64).
      moves: moves.map(({ productId, newPosition }) => ({
        id: productId,
        newPosition: String(newPosition),
      })),
    });

  return collectionReorderProducts?.job?.id ?? null;
}

// Shopify's limit on moves in one reorder call.
export const MAX_REORDERED_PRODUCTS = 250;

type JobData = {
  job: { done: boolean } | null;
};

const JOB_QUERY = `
  query Job($id: ID!) {
    job(id: $id) {
      done
    }
  }
`;

// Polls a Shopify background job until it finishes, giving up after about
// ten seconds.
async function waitForJob(id: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const { job } = await shopifyQuery<JobData>(JOB_QUERY, { id });
    if (!job || job.done) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Saves `productIds` as the first products of the collection, in that order,
// and resolves once Shopify has applied it. Returns false when the collection
// doesn't exist.
export async function saveProductOrder(
  collectionId: string,
  productIds: string[],
) {
  if (!(await ensureManualSortOrder(collectionId))) return false;

  // Placing every product at its index, front to back, produces the order
  // whatever order the collection was in before.
  const jobId = await updateProductOrder(
    collectionId,
    productIds.map((productId, index) => ({ productId, newPosition: index })),
  );
  if (jobId) await waitForJob(jobId);
  return true;
}
