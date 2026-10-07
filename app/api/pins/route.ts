import { shopifyErrorResponse } from "@/lib/shopify/error-response";
import { ShopifyUserError } from "@/lib/shopify/graphql";
import { getPinnedProductIds, setPinnedProductIds } from "@/lib/shopify/pins";

// Both handlers take the collection's full Shopify ID
// (gid://shopify/Collection/123).

export async function GET(request: Request) {
  const collectionId = new URL(request.url).searchParams.get("collectionId");

  if (!collectionId) {
    return Response.json(
      { error: "No collection was provided." },
      { status: 400 },
    );
  }

  try {
    const pinnedIds = await getPinnedProductIds(collectionId);

    if (!pinnedIds) {
      return Response.json(
        { error: "This collection doesn't exist." },
        { status: 404 },
      );
    }
    return Response.json(pinnedIds);
  } catch (error) {
    return shopifyErrorResponse(
      "Pinned products could not be loaded from Shopify.",
      error,
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const collectionId: unknown = body?.collectionId;
  const pinnedIds: unknown = body?.pinnedIds;

  if (
    typeof collectionId !== "string" ||
    !Array.isArray(pinnedIds) ||
    !pinnedIds.every((id) => typeof id === "string")
  ) {
    return Response.json(
      { error: "A collection and a list of pinned products are required." },
      { status: 400 },
    );
  }

  try {
    await setPinnedProductIds(collectionId, pinnedIds);
    return Response.json(pinnedIds);
  } catch (error) {
    if (error instanceof ShopifyUserError) {
      return Response.json(
        { error: error.message, userErrors: error.userErrors },
        { status: 422 },
      );
    }
    return shopifyErrorResponse(
      "Pinned products could not be saved to Shopify.",
      error,
    );
  }
}
