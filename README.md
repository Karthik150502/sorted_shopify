# Sorted

A prototype Shopify app for ordering the products in a collection. It connects to one development store and lets you:

- reorder a collection's products by drag and drop,
- pin products to the top of a collection,
- sort products with rules (newest, inventory, price, title, out of stock last),
- save the resulting order back to Shopify.

Built with Next.js, Shopify Polaris, dnd-kit and TanStack Query. There is no login or app installation flow: the server talks to the store's Admin API with the credentials you configure below.

## Prerequisites

- Node.js 20.9 or later
- [pnpm](https://pnpm.io/installation)
- A Shopify development store
- A Shopify app, created in the [Dev Dashboard](https://dev.shopify.com/dashboard), that is:
  - in the same organization as the store,
  - released with the `write_products` access scope,
  - installed on the store.

## Setup

1. Install the dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env.local` file in the project root:

   ```dotenv
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_CLIENT_ID=your-app-client-id
   SHOPIFY_CLIENT_SECRET=your-app-client-secret
   SHOPIFY_API_VERSION=2026-10
   ```

   | Variable | Where to find it |
   | --- | --- |
   | `SHOPIFY_STORE_DOMAIN` | The store's `.myshopify.com` domain, without `https://`. |
   | `SHOPIFY_CLIENT_ID` | The app's **Settings** page in the Dev Dashboard. |
   | `SHOPIFY_CLIENT_SECRET` | The same page, under the client ID. |
   | `SHOPIFY_API_VERSION` | A [supported Admin API version](https://shopify.dev/docs/api/usage/versioning), such as `2026-10`. |

   `.env.local` is ignored by git. Keep the client secret out of version control; it is only ever read on the server.

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and choose **Go to Collections**.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts the development server on port 3000. |
| `pnpm build` | Creates a production build. |
| `pnpm start` | Serves the production build. |
| `pnpm lint` | Runs ESLint. |

## How it connects to Shopify

The server exchanges the client ID and secret for an Admin API access token (Shopify's client credentials grant), keeps it in memory, and requests a new one shortly before it expires. Tokens last 24 hours, and one is fetched again whenever the server restarts.

Saving a product order switches the collection's sort order to **Manual** in Shopify, because Shopify only keeps a custom order on manually sorted collections. Pinned products are stored on the collection in the `custom.pinned_products` metafield.

## Troubleshooting

The collections page shows an error banner, and the terminal running `pnpm dev` logs Shopify's reason.

| Message in the terminal | Fix |
| --- | --- |
| `Missing environment variable: …` | Add the variable to `.env.local` and restart `pnpm dev`. |
| `The application is not installed on this shop` | Install the app on the store named in `SHOPIFY_STORE_DOMAIN`, and check that the app and the store are in the same organization. |
| `Access denied for … field` | The app is missing an access scope. Add it to the app, release a new version, and reinstall the app on the store. |

## Project layout

| Path | Contents |
| --- | --- |
| `app/` | Pages (`/`, `/collections`, `/collections/[id]`) and the API routes under `app/api/`. |
| `components/` | The product grid, sorting rules sidebar, infinite scroll and modal. |
| `hooks/` | TanStack Query wrappers for the app's API routes. |
| `lib/shopify/` | Server-only Admin API code: access token, GraphQL helpers, collections, products, pins. |
| `lib/applyRules.ts` | The rule-based sorting logic. |
| `constants/env.ts` | Reads and checks the environment variables. |
