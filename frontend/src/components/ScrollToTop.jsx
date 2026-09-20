import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Each step of the booking flow is a new page — start every page at the top.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;