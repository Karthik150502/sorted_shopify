# Shopify Product Sorting Prototype — Feature Requirements

## 1. Overview

A Shopify prototype app that showcases one core feature set: reordering the products of a collection, either manually (drag and drop) or automatically (rule-based sorting).

This is a prototype of the core feature only. No authentication, OAuth, or app installation flow.

## 2. Store Connection and Data

- Connect to the existing Shopify dev store using its store domain and Admin API access token.
- Fetch real collections and products with the GraphQL Admin API; retrieve only the product data the features need.
- Persist ordering changes to the real collection in Shopify.
- Keep the access token server-side; never expose it to browser code.

## 3. Feature I — Drag and Drop

### 3.1 Collections page

- Display all collections of the store.
- Clicking a collection redirects to its products page.

### 3.2 Collection products page

- Show the collection's products in a grid.
- Products can be dragged and dropped to change their order within the collection.
- The drag-and-drop interaction must be very smooth.

### 3.3 Save, Reset, Undo

- **Save changes** — enabled as soon as any product's position changes; updates the product order of the collection in Shopify.
- **Reset** — discards all unsaved changes and restores the saved order.
- **Undo** — reverts only the latest unsaved change.

Reset and Undo sit alongside Save changes and apply only to changes made before Save changes is clicked.

## 4. Feature II — Rule-Based Sorting

- A sidebar on the right of the products page lets users configure sorting settings.
- Rules:
  - Move out-of-stock products to the bottom.
  - Bring newest products to the top.
  - Sort by product title.
  - Sort by product description.
  - Sort by metafield.
  - Sort by inventory quantity.
  - Sort by availability.

## 5. UX Requirements

- Proper cursor pagination with an infinite scroller.
- Error feedback using custom error messages and error banners.
- Loading skeletons, plus loading feedback wherever an action is in progress.

## 6. UI Conventions

- Use Shopify Polaris components only; build a custom component only when Polaris has no alternative.
- Follow Shopify Admin's design conventions.
