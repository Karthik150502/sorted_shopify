"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { ImageIcon, PinFilledIcon, PinIcon } from "@shopify/polaris-icons";
import { formatPrice } from "@/components/product-card";
import type { Product } from "@/lib/shopify/products";
import styles from "./product-card.module.css";

// What a save needs to write; each part is present only if it changed.
export type ProductGridChanges = {
  products?: Product[];
  pinnedIds?: string[];
};

type ProductGridProps = {
  products: Product[];
  // The saved pinned product IDs, or undefined until they have loaded.
  pinnedIds: string[] | undefined;
  // True while a save is in progress.
  saving: boolean;
  onSave: (changes: ProductGridChanges) => void;
  onReset: () => void;
  // Called whenever the grid gains or loses unsaved changes.
  onUnsavedChange: (hasChanges: boolean) => void;
};

type ProductTileProps = {
  product: Product;
  pinned: boolean;
  // Undefined while pins can't be changed yet.
  onTogglePin: ((id: string) => void) | undefined;
};

function ProductTile({ product, pinned, onTogglePin }: ProductTileProps) {
  const { id, title, imageUrl, inventory, price } = product;

  return (
    <Card padding="0">
      <div className={styles.media}>
        {imageUrl ? (
          // Shopify's CDN already serves the image at the size requested.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className={styles.image}
          />
        ) : (
          <Icon source={ImageIcon} tone="subdued" />
        )}
        <div className={styles.pin}>
          <Button
            icon={pinned ? PinFilledIcon : PinIcon}
            pressed={pinned}
            disabled={!onTogglePin}
            accessibilityLabel={pinned ? `Unpin ${title}` : `Pin ${title}`}
            onClick={() => onTogglePin?.(id)}
          />
        </div>
      </div>
      <Box padding="300">
        <BlockStack gap="150" inlineAlign="start">
          <Text as="h3" variant="bodyMd" fontWeight="semibold" truncate>
            {title}
          </Text>
          <Text as="p" variant="bodyMd">
            {formatPrice(price)}
          </Text>
          {inventory === 0 ? (
            <Badge tone="critical">Out of stock</Badge>
          ) : (
            <Text as="p" variant="bodySm" tone="subdued">
              {inventory === null
                ? "Inventory not tracked"
                : `${inventory} in stock`}
            </Text>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

function SortableProductTile(props: ProductTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.product.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "grab",
        // The tile being dragged is shown by the overlay; this one stays
        // behind, dimmed, to mark where it will land.
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <ProductTile {...props} />
    </div>
  );
}

export function ProductGrid({
  products,
  pinnedIds,
  saving,
  onSave,
  onReset,
  onUnsavedChange,
}: ProductGridProps) {
  // Product IDs in their unsaved order, or null while nothing has been moved.
  const [order, setOrder] = useState<string[] | null>(null);
  // Pinned product IDs with unsaved toggles applied, or null while no pin has
  // been toggled.
  const [pins, setPins] = useState<string[] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sensors = useSensors(
    // The small distance lets clicks on the pin button through without
    // starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const currentPins = pins ?? pinnedIds ?? [];

  // Products that arrive after a move (more pages loading) go at the end.
  const ordered = order
    ? [
        ...order.flatMap((id) => products.find((p) => p.id === id) ?? []),
        ...products.filter((p) => !order.includes(p.id)),
      ]
    : products;
  // Pinned products always lead the grid, keeping their relative order.
  const pinnedItems = ordered.filter((p) => currentPins.includes(p.id));
  const unpinnedItems = ordered.filter((p) => !currentPins.includes(p.id));
  const items = [...pinnedItems, ...unpinnedItems];
  const draggedProduct = items.find((product) => product.id === draggedId);
  // The order is compared with the saved one as the grid would show it, with
  // the saved pins leading, so pins saved before don't count as a change.
  const savedPins = pinnedIds ?? [];
  const savedItems = [
    ...products.filter((p) => savedPins.includes(p.id)),
    ...products.filter((p) => !savedPins.includes(p.id)),
  ];
  const orderChanged = items.some(
    (product, index) => product.id !== savedItems[index].id,
  );

  const pinsChanged =
    pins !== null &&
    pinnedIds !== undefined &&
    (pins.length !== pinnedIds.length ||
      pins.some((id) => !pinnedIds.includes(id)));
  const hasChanges = orderChanged || pinsChanged;

  useEffect(() => {
    onUnsavedChange(hasChanges);
  }, [hasChanges, onUnsavedChange]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggedId(null);
    if (!over || active.id === over.id) return;
    // Pinned products only trade places with each other, and so do the rest.
    if (
      currentPins.includes(String(active.id)) !==
      currentPins.includes(String(over.id))
    ) {
      return;
    }

    const ids = items.map((product) => product.id);
    setOrder(
      arrayMove(
        ids,
        ids.indexOf(String(active.id)),
        ids.indexOf(String(over.id)),
      ),
    );
  }

  function togglePin(id: string) {
    setPins(
      currentPins.includes(id)
        ? currentPins.filter((pinnedId) => pinnedId !== id)
        : [...currentPins, id],
    );
  }

  function handleReset() {
    setOrder(null);
    setPins(null);
    onReset();
  }

  function tileProps(product: Product): ProductTileProps {
    return {
      product,
      pinned: currentPins.includes(product.id),
      onTogglePin: pinnedIds ? togglePin : undefined,
    };
  }

  return (
    <BlockStack gap="400">
      <InlineStack align="end">
        <ButtonGroup>
          <Button disabled={!hasChanges || saving} onClick={handleReset}>
            Reset
          </Button>
          <Button
            variant="primary"
            disabled={!hasChanges}
            loading={saving}
            onClick={() =>
              onSave({
                products: orderChanged ? items : undefined,
                pinnedIds: pinsChanged ? currentPins : undefined,
              })
            }
          >
            Save changes
          </Button>
        </ButtonGroup>
      </InlineStack>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setDraggedId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggedId(null)}
      >
        {/* Separate sortable groups, so tiles only make room for a dragged
            tile of their own kind. */}
        <InlineGrid columns={{ xs: 2, sm: 3, lg: 4, xl: 5 }} gap="400">
          {[pinnedItems, unpinnedItems].map((group, index) => (
            <SortableContext
              key={index}
              items={group}
              strategy={rectSortingStrategy}
            >
              {group.map((product) => (
                <SortableProductTile key={product.id} {...tileProps(product)} />
              ))}
            </SortableContext>
          ))}
        </InlineGrid>
        {/* The overlay is fixed to the viewport, so dragging past the last
            product can't stretch the page and keep it scrolling. */}
        <DragOverlay>
          {draggedProduct && (
            <div style={{ cursor: "grabbing" }}>
              <ProductTile {...tileProps(draggedProduct)} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </BlockStack>
  );
}
