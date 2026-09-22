import { useCallback, useEffect, useMemo, useState } from "react";

import { ServicesContext } from "./servicesContext";
import {
  decorateService,
  findService,
  searchServices,
  sortServices,
} from "../data/servicesData";
import { apiFetch } from "../utils/api";

// Loads GET /api/services once, when the app starts, and shares the result
// with every page (home, all services, detail, booking, footer…).
function ServicesProvider({ children }) {
  const [state, setState] = useState({
    status: "loading", // "loading" | "ready" | "error"
    services: [],
    error: "",
  });

  const load = useCallback(async (signal) => {
    try {
      const data = await apiFetch("/api/services", { signal });

      setState({
        status: "ready",
        services: sortServices((data.services ?? []).map(decorateService)),
        error: "",
      });
    } catch (error) {
      if (error?.name === "AbortError") return;

      setState({
        status: "error",
        services: [],
        error: error.message || "Unable to load services.",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const value = useMemo(
    () => ({
      services: state.services,
      isLoading: state.status === "loading",
      error: state.status === "error" ? state.error : "",

      // Try again after a failed load
      reload: () => {
        setState((previous) => ({ ...previous, status: "loading", error: "" }));
        load();
      },

      getServiceBySlug: (slug) => findService(state.services, slug),
      searchServices: (query) => searchServices(state.services, query),
    }),
    [state, load]
  );

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
}

export default ServicesProvider;