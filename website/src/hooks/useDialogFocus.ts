"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Keep keyboard focus inside an open dialog, and put it back where it came
 * from when the dialog closes.
 *
 * A panel that is only visually on top of the page is not a dialog: Tab walks
 * straight out of it into the page underneath, and a keyboard reader who
 * closes it is dropped at the top of the document. This does the three things
 * that make the panel behave like the thing it looks like:
 *
 * - focus moves into the panel when it opens;
 * - Tab and Shift+Tab cycle through the panel's own controls;
 * - Escape closes it, and focus returns to the control that opened it.
 *
 * The body is locked by default so a phone cannot scroll the page behind the
 * sheet. The notification panel passes `lockScroll: false` because it is a
 * small panel beside the header rather than a page-covering sheet.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Options {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  lockScroll?: boolean;
}

export function useDialogFocus({
  open,
  panelRef,
  triggerRef,
  onClose,
  lockScroll = true,
}: Options) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const trigger = triggerRef.current;

    const focusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );

    const frame = requestAnimationFrame(() => {
      const first = focusable()[0] ?? panel;
      first.focus();
    });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open, panelRef, triggerRef, lockScroll]);
}
