import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { MantineProvider, createTheme } from "@mantine/core";
import { store } from "./store.ts";
import { Provider } from "react-redux";
const theme = createTheme({
  // fontFamily: "Roboto",
  // fontFamily: "sans-serif",
  headings: { fontFamily: "Roboto" },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Provider store={store}>
        <App />
      </Provider>
    </MantineProvider>
  </React.StrictMode>
);
