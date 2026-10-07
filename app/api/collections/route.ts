import { HttpResponseError } from "@shopify/shopify-api";
import { getCollections } from "@/lib/shopify/collections";

export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get("cursor");

  try {
    return Response.json(await getCollections(cursor));
  } catch (error) {
    console.error(
      "Failed to load collections:",
      error instanceof Error ? error.message : error,
      // Shopify puts the actual reason for a rejected request in the body.
      error instanceof HttpResponseError ? error.response.body : "",
    );
    return Response.json(
      { error: "Collections could not be loaded from Shopify." },
      { status: 502 },
    );
  }
}
