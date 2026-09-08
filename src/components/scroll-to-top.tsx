import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_CONTAINER_SELECTOR = "[data-app-scroll-container]";

/** Reset primary app scroll position when the route changes. */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const main = document.querySelector(SCROLL_CONTAINER_SELECTOR);
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}
