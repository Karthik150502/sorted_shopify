"use client";

import { Modal } from "@shopify/polaris";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
};

export function ConfirmModal({
  open,
  title,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      primaryAction={{ content: confirmLabel, onAction: onConfirm }}
      secondaryActions={[{ content: cancelLabel, onAction: onCancel }]}
    >
      <Modal.Section>{children}</Modal.Section>
    </Modal>
  );
}
