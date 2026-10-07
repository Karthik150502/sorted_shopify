import { shopifyErrorResponse } from "@/lib/shopify/error-response";
import { isShopifyId } from "@/lib/shopify/gid";
import { ShopifyUserError } from "@/lib/shopify/graphql";
import {
  MAX_REORDERED_PRODUCTS,
  saveProductOrder,
} from "@/lib/shopify/products";

export async function POST(
  request: Request,
  context: RouteContext<"/api/collections/[id]/order">,
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const productIds: unknown = body?.productIds;

  // Saving switches the collection to manual sorting before it reorders, so
  // a malformed order is refused here, before anything in Shopify changes.
  if (
    !Array.isArray(productIds) ||
    productIds.length === 0 ||
    !productIds.every((productId) => isShopifyId(productId, "Product")) ||
    new Set(productIds).size !== productIds.length
  ) {
    return Response.json(
      { error: "No valid product order was provided." },
      { status: 400 },
    );
  }
  if (productIds.length > MAX_REORDERED_PRODUCTS) {
    return Response.json(
      {
        error: `Only the first ${MAX_REORDERED_PRODUCTS} products of a collection can be reordered at once.`,
      },
      { status: 400 },
    );
  }

  try {
    const saved = await saveProductOrder(
      `gid://shopify/Collection/${id}`,
      productIds,
    );

    if (!saved) {
      return Response.json(
        { error: "This collection doesn't exist." },
        { status: 404 },
      );
    }
    return Response.json({ saved: true });
  } catch (error) {
    // Shopify's validation messages explain what to fix, so pass them on.
    if (error instanceof ShopifyUserError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return shopifyErrorResponse(
      "The product order could not be saved to Shopify.",
      error,
    );
  }
}
