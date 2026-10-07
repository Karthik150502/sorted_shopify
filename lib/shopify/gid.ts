// True when `value` is a Shopify global ID of the given type, for example
// gid://shopify/Product/123.
export function isShopifyId(
  value: unknown,
  type: "Collection" | "Product",
): value is string {
  return (
    typeof value === "string" &&
    new RegExp(`^gid://shopify/${type}/\\d+$`).test(value)
  );
}
