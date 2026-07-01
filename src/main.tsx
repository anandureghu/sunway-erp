import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Bundled SVG country flags (render reliably on Windows, unlike emoji flags).
import "flag-icons/css/flag-icons.min.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext.tsx";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <ConfirmDialogProvider>
            <Toaster position="bottom-center" richColors closeButton />
            <App />
          </ConfirmDialogProvider>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
