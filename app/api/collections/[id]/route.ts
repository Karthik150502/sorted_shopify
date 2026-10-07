import { getCollection } from "@/lib/shopify/collections";
import { shopifyErrorResponse } from "@/lib/shopify/error-response";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/collections/[id]">,
) {
  const { id } = await context.params;

  try {
    const collection = await getCollection(`gid://shopify/Collection/${id}`);

    if (!collection) {
      return Response.json(
        { error: "This collection doesn't exist." },
        { status: 404 },
      );
    }
    return Response.json(collection);
  } catch (error) {
    return shopifyErrorResponse(
      "The collection could not be loaded from Shopify.",
      error,
    );
  }
}
