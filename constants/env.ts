import "server-only";

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    console.error(`Missing environment variable: ${name}`);
    return "";
  }
  return value;
}

export const env = {
  SHOPIFY_CLIENT_ID: getEnv("SHOPIFY_CLIENT_ID"),
  SHOPIFY_CLIENT_SECRET: getEnv("SHOPIFY_CLIENT_SECRET"),
  SHOPIFY_STORE_DOMAIN: getEnv("SHOPIFY_STORE_DOMAIN"),
  SHOPIFY_API_VERSION: getEnv("SHOPIFY_API_VERSION"),
};
