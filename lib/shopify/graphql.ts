import "server-only";
import "@shopify/shopify-api/adapters/web-api";
import { ApiVersion, shopifyApi } from "@shopify/shopify-api";

type Variables = Record<string, unknown>;

export type UserError = {
  field?: string[] | null;
  message: string;
};

type MutationPayload = { userErrors?: UserError[] } | null;

export class ShopifyUserError extends Error {
  constructor(public userErrors: UserError[]) {
    super(userErrors.map((error) => error.message).join("; "));
    this.name = "ShopifyUserError";
  }
}

function createClient() {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION;

  if (!storeDomain || !accessToken || !apiVersion) {
    throw new Error(
      "Missing Shopify configuration. Set SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN and SHOPIFY_API_VERSION.",
    );
  }

  const shopify = shopifyApi({
    // Only used for OAuth and webhook verification, which this app doesn't do.
    apiSecretKey: "unused",
    adminApiAccessToken: accessToken,
    apiVersion: apiVersion as ApiVersion,
    hostName: storeDomain,
    isCustomStoreApp: true,
    isEmbeddedApp: false,
  });

  return new shopify.clients.Graphql({
    session: shopify.session.customAppSession(storeDomain),
  });
}

let client: ReturnType<typeof createClient> | undefined;

async function request<TData>(operation: string, variables?: Variables) {
  client ??= createClient();
  // Retries cover 429 and 5xx responses; other failures throw a ShopifyError.
  const { data } = await client.request<TData>(operation, {
    variables,
    retries: 2,
  });
  return data as TData;
}

export function shopifyQuery<TData>(query: string, variables?: Variables) {
  return request<TData>(query, variables);
}

// Shopify reports validation failures as `userErrors` inside a successful
// response, so they are surfaced here as a thrown ShopifyUserError.
export async function shopifyMutation<
  TData extends Record<string, MutationPayload>,
>(mutation: string, variables?: Variables) {
  const data = await request<TData>(mutation, variables);
  const userErrors = Object.values(data).flatMap(
    (payload) => payload?.userErrors ?? [],
  );

  if (userErrors.length > 0) {
    throw new ShopifyUserError(userErrors);
  }
  return data;
}
