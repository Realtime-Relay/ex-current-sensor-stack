import React from "react";
import ReactDOM from "react-dom/client";
import { RelayProvider } from "@relay-x/ui";
import "@relay-x/ui/styles.css";

import { app } from "./relayx";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RelayProvider app={app}>
      <App />
    </RelayProvider>
  </React.StrictMode>,
);
