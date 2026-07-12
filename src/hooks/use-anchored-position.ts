import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export type AnchoredPopoverPosition = {
  /** DOM node the popover should be portaled into. */
  container: Element;
  /** Ready-to-spread inline style placing the popover directly under the anchor. */
  style: CSSProperties;
};

/**
 * Finds the DOM node a popover anchored to `anchorEl` should be portaled into.
 *
 * Portaling straight to `document.body` breaks inside a Radix Dialog: the dialog's
 * focus trap treats anything outside its own DOM subtree as "outside the dialog" and
 * blocks pointer/keyboard interaction with it. So when the anchor lives inside an open
 * Radix dialog (`[data-slot="dialog-content"]`), we portal into that dialog's content
 * node instead — still escaping any `overflow-hidden` card/section, but staying inside
 * the dialog's own DOM subtree so the focus trap leaves it alone.
 */
function findPortalContainer(anchorEl: Element): Element {
  return anchorEl.closest('[data-slot="dialog-content"]') ?? document.body;
}

/**
 * Tracks where a portal-rendered popover anchored to `anchorRef` should render and how
 * it should be positioned, while `open` is true. See {@link findPortalContainer} for why
 * the container isn't always `document.body`.
 *
 * - Portaling to `document.body`: position is `fixed` with viewport-relative coordinates
 *   (from `getBoundingClientRect`), since `position: fixed` is viewport-relative by default.
 * - Portaling into a dialog's content node: that node already has `position: fixed` itself
 *   (see dialog.tsx) plus a `transform` (translate for centering), which establishes a new
 *   containing block for descendants — so a `position: fixed` child would resolve relative
 *   to the dialog's box, not the viewport. We use `position: absolute` instead, with
 *   coordinates computed relative to the dialog content's own bounding rect.
 */
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
): AnchoredPopoverPosition | null {
  const [position, setPosition] = useState<AnchoredPopoverPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const anchorRect = el.getBoundingClientRect();
      const container = findPortalContainer(el);

      if (container === document.body) {
        setPosition({
          container,
          style: {
            position: "fixed",
            top: anchorRect.bottom,
            left: anchorRect.left,
            width: anchorRect.width,
          },
        });
        return;
      }

      const containerRect = container.getBoundingClientRect();
      setPosition({
        container,
        style: {
          position: "absolute",
          top: anchorRect.bottom - containerRect.top,
          left: anchorRect.left - containerRect.left,
          width: anchorRect.width,
        },
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef, open]);

  return position;
}
