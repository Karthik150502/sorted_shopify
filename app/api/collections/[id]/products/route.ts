import { shopifyErrorResponse } from "@/lib/shopify/error-response";
import { getCollectionProducts } from "@/lib/shopify/products";

export async function GET(
  request: Request,
  context: RouteContext<"/api/collections/[id]/products">,
) {
  const { id } = await context.params;
  const cursor = new URL(request.url).searchParams.get("cursor");

  try {
    const page = await getCollectionProducts(
      `gid://shopify/Collection/${id}`,
      cursor,
    );

    if (!page) {
      return Response.json(
        { error: "This collection doesn't exist." },
        { status: 404 },
      );
    }
    return Response.json(page);
  } catch (error) {
    return shopifyErrorResponse(
      "Products could not be loaded from Shopify.",
      error,
    );
  }
}
