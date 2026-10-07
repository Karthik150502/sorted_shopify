import { getCollections } from "@/lib/shopify/collections";
import { shopifyErrorResponse } from "@/lib/shopify/error-response";

export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get("cursor");

  try {
    return Response.json(await getCollections(cursor));
  } catch (error) {
    return shopifyErrorResponse(
      "Collections could not be loaded from Shopify.",
      error,
    );
  }
}
