import "@mantine/core/styles.css";
import "./App.css";
import { AppShell, Text } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

function MuscleDiagram() {
  function clickHandler(e: React.MouseEvent<SVGPathElement>) {
    const path = e.target as SVGPathElement;
    console.log(path.parentElement!.id);
  }
  return (
    <svg
      height="90vh"
      viewBox="0.00 0.00 394.00 928.00"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke-linecap="round"
        transform="translate(-527.00, -34.00)"
        id="Glutes"
      >
        <path
          onClick={clickHandler}
          d="M657.87,423.47 C659.76,423.52 665.94,425.74 669.25,427.61 C674.85,430.83 691.00,443.71 696.99,449.33 C703.09,455.08 712.60,467.47 715.39,473.40 C716.80,476.43 719.05,483.21 719.65,486.18 C721.07,493.46 720.46,509.69 718.97,517.63 C718.11,522.11 715.90,528.79 713.75,532.41 C711.69,535.80 706.28,540.55 703.19,541.75 C699.98,542.94 693.39,543.36 687.84,543.00 C678.77,542.35 666.98,540.12 665.27,540.18 C663.66,540.28 660.61,541.37 659.11,542.37 C657.65,543.40 655.06,546.16 653.99,547.87 C653.28,549.01 650.31,554.83 649.85,555.57 C649.00,556.90 647.57,557.69 647.00,557.28 C645.61,556.03 645.31,535.95 644.83,528.09 C644.31,520.52 642.06,507.07 643.06,500.47 C643.63,496.86 646.09,488.17 646.42,486.18 C646.94,483.00 647.02,474.66 646.69,471.54 C646.39,468.80 644.59,459.95 644.32,456.66 C643.71,448.73 646.27,435.43 647.43,431.93 C648.25,429.59 650.06,426.57 651.39,425.45 C652.76,424.37 655.89,423.47 657.87,423.47 Z"
          fill="red"
          stroke="rgb(0, 0, 0)"
          stroke-width="3.00"
          stroke-opacity="1.00"
          stroke-linejoin="miter"
        />
      </g>
    </svg>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MuscleDiagram />,
  },
  {
    path: "/about",
    element: <div>about?</div>,
  },
]);

function App() {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm" }}>
      <AppShell.Header>
        <Text>Corpore Sano</Text>
      </AppShell.Header>
      <AppShell.Navbar p="md">Navbar</AppShell.Navbar>
      <AppShell.Main>
        <RouterProvider router={router} />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
