import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { MantineProvider, createTheme } from "@mantine/core";
import { store } from "./store.ts";
import { Provider } from "react-redux";
import React from "react";
const theme = createTheme({});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Provider store={store}>
        <App />
      </Provider>
    </MantineProvider>
  </React.StrictMode>
);
