import { shopifyQuery } from "@/lib/shopify/graphql";

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
