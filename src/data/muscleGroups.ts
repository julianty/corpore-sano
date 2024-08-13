interface MuscleGroup {
  name: string;
  sets: number;
  weightTotal: number;
  parentGroup: string;
  lastWorked: number;
}

interface MuscleGroups {
  [key: string]: MuscleGroup;
}

const muscleGroups: MuscleGroups = {
  Trapezius: {
    name: "Trapezius",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Back",
    lastWorked: 0,
  },
  Rhomboids: {
    name: "Rhomboids",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Back",
    lastWorked: 0,
  },
  Deltoids: {
    name: "Deltoids",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Shoulders",
    lastWorked: 0,
  },
  "Lattisimus Dorsi": {
    name: "Lattisimus Dorsi",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Back",
    lastWorked: 0,
  },
  Triceps: {
    name: "Triceps",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Arms",
    lastWorked: 0,
  },
  Biceps: {
    name: "Biceps",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Arms",
    lastWorked: 0,
  },
  Forearms: {
    name: "Forearms",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Arms",
    lastWorked: 0,
  },
  Pectorals: {
    name: "Pectorals",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Chest",
    lastWorked: 0,
  },
  Abdominals: {
    name: "Abdominals",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Core",
    lastWorked: 0,
  },
  "Spinal Erectors": {
    name: "Spinal Erectors",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Back",
    lastWorked: 0,
  },
  Glutes: {
    name: "Glutes",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Legs",
    lastWorked: 0,
  },
  Quadriceps: {
    name: "Quadriceps",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Legs",
    lastWorked: 0,
  },
  Hamstrings: {
    name: "Hamstrings",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Legs",
    lastWorked: 0,
  },
  Calves: {
    name: "Calves",
    sets: 0,
    weightTotal: 0,
    parentGroup: "Legs",
    lastWorked: 0,
  },
};

const parentGroups = ["Shoulders", "Back", "Chest", "Arms", "Core", "Legs"];

export { muscleGroups, parentGroups };
