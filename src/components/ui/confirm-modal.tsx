"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "default";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  loading = false,
}: ConfirmModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element (Cancel button) after render
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled])'
        );
        firstFocusable?.focus();
      }
    }, 0);

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("keydown", handleFocusTrap);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("keydown", handleFocusTrap);
      // Restore focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, [open, onClose, handleFocusTrap]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-[400px] rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.6)]"
      >
        <div className="px-5 pt-5 pb-4">
          <h2 id="confirm-modal-title" className="text-[15px] font-semibold text-white">{title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#888]">
            {description}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#1a1a1a] px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { type ConfirmModalProps };
