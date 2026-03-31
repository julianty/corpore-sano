import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { MantineProvider, createTheme } from "@mantine/core";
import { store } from "./store.ts";
import { Provider } from "react-redux";
import React from "react";
import { corporeTheme } from "./styles/theme";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const theme = createTheme(corporeTheme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Provider store={store}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Provider>
    </MantineProvider>
  </React.StrictMode>
);
