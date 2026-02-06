import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { i18nReady } from "./i18n";

i18nReady.then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
});
