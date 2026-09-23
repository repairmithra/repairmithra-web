import { createContext } from "react";

// Holds the list of services loaded from the backend.
// Use the useServices() hook (src/hooks/useServices.js) to read it.
export const ServicesContext = createContext(null);