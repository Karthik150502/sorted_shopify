"use client";

import { BlockStack, Button, Card, InlineStack, Page, Text } from "@shopify/polaris";

export default function HomePage() {
  return (
    <Page title="Home" narrowWidth>
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              Welcome to Sorted
            </Text>
            <Text as="p" tone="subdued">
              Reorder the products in your collections by dragging and dropping
              them, or by applying sorting rules.
            </Text>
          </BlockStack>
          <InlineStack>
            <Button variant="primary" url="/collections">
              Go to Collections
            </Button>
          </InlineStack>
        </BlockStack>
      </Card>
    </Page>
  );
}
