import { HttpResponseError } from "@shopify/shopify-api";

// Logs the underlying failure on the server and returns the `{ error }` body
// the browser hooks expect.
export function shopifyErrorResponse(message: string, error: unknown) {
  console.error(
    `${message}:`,
    error instanceof Error ? error.message : error,
    // Shopify puts the actual reason for a rejected request in the body.
    error instanceof HttpResponseError ? error.response.body : "",
  );
  return Response.json({ error: message }, { status: 502 });
}
