import React from "react";
import { useState } from "react";
import FrontMuscles from "../assets/FrontMuscles";
import { Box, Group, Stack, Title, Text } from "@mantine/core";
import BackMuscles from "../assets/BackMuscles";

export function MuscleDiagram() {
  const [activeMuscle, setActiveMuscle] = useState("");

  function onMouseEnterHandler(e: React.MouseEvent<SVGElement>) {
    const target = e.target as HTMLElement;
    const parentElement = target.parentElement!;
    setActiveMuscle(parentElement.id);
  }
  const svgProps = {
    width: "200px",
    height: "500px",
    onMouseEnterHandler: onMouseEnterHandler,
  };

  return (
    <Stack>
      <Title order={2}>Body Diagram</Title>
      <Box w="100%" h="500px">
        <Group grow>
          <Box className="muscles-front">
            <FrontMuscles {...svgProps} />
          </Box>
          <Box className="muscles-back">
            <BackMuscles {...svgProps} />
          </Box>
        </Group>
      </Box>
      <Text>{`You are currently hovering over ${activeMuscle}`}</Text>
    </Stack>
  );
}
