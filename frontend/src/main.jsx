import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ServicesProvider from "./context/ServicesProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ServicesProvider>
        <App />
      </ServicesProvider>
    </BrowserRouter>
  </React.StrictMode>
);