import "server-only";
import "@shopify/shopify-api/adapters/web-api";
import { ApiVersion, Session, shopifyApi } from "@shopify/shopify-api";
import { env } from "@/constants/env";

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

function createShopify() {
  return shopifyApi({
    apiKey: env.SHOPIFY_CLIENT_ID,
    apiSecretKey: env.SHOPIFY_CLIENT_SECRET,
    apiVersion: ApiVersion.October26,
    hostName: env.SHOPIFY_STORE_DOMAIN,
    isEmbeddedApp: false,
  });
}

let shopify: ReturnType<typeof createShopify> | undefined;
let session: Session | undefined;

async function request<TData>(operation: string, variables?: Variables) {
  shopify ??= createShopify();

  // Client-credentials tokens expire after 24 hours, so fetch a new one when
  // there is none yet or the current one is within a minute of expiring.
  if (!session || session.isExpired(60_000)) {
    ({ session } = await shopify.auth.clientCredentials({
      shop: env.SHOPIFY_STORE_DOMAIN,
    }));
  }

  const client = new shopify.clients.Graphql({ session });
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
