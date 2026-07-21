import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { PWAUpdatePrompt } from "./pwa/PWAUpdatePrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./styles/themes.css";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TooltipProvider delayDuration={150}>
        <App />
        <PWAUpdatePrompt />
      </TooltipProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
