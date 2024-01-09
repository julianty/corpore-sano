import {
  AbdominalMuscles,
  AnteriorDeltoid,
  Biceps,
  BodyOutlineBack,
  BodyOutlineFront,
  Pectorals,
  Quadriceps,
} from "../assets/svgr/MuscleIndex";
import { Box, Group } from "@mantine/core";
export function MuscleDiagram() {
  // function clickHandler(e: React.MouseEvent<SVGPathElement>) {
  //   const path = e.target as SVGPathElement;
  //   console.log(path.parentElement!.id);
  // }
  const svgProps = {
    width: "200px",
    height: "500px",
  };

  return (
    <Group grow>
      <Box className="muscles-front">
        <BodyOutlineFront {...svgProps} />
        <Pectorals {...svgProps} />
        <Biceps {...svgProps} />
        <AnteriorDeltoid {...svgProps} />
        <Quadriceps {...svgProps} />
        <AbdominalMuscles {...svgProps} />
      </Box>
      <Box className="muscles-back">
        <BodyOutlineBack {...svgProps} />
      </Box>
    </Group>
  );
}
