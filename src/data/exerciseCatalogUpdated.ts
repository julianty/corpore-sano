// Should I add equipment as a property of the exercise object? e.g. "equipment": ["Barbell", "Dumbbell", "Cable Machine", "Smith Machine", "Bodyweight"]

const exerciseCatalog = {
  data: [
    {
      name: "Squat",
      muscles: ["Quadriceps", "Hamstrings", "Glutes"],
      variants: [
        "Cyclist Squat",
        "Sumo Squat",
        "Barbell Back Squat",
        "Front Squat",
        "Hack Squat",
        "Goblet Squat",
      ],
    },

    {
      name: "Bench Press",
      muscles: ["Pectorals", "Deltoids"],
      variants: [
        "Barbell Bench Press",
        "Incline Barbell Bench Press",
        "Decline Barbell Bench Press",
      ],
    },
    {
      name: "Deadlift",
      muscles: ["Quadriceps", "Hamstrings", "Lattisimus Dorsi"],
      variants: ["Conventional Deadlift", "Sumo Deadlift", "Dumbbell Deadlift"],
    },
    {
      name: "Bicep Curl",
      muscles: ["Bicep", "Deltoids"],
      variants: [
        "Dumbbell Curl",
        "Hammer Curl",
        "Preacher Curl",
        "Concentration Curl",
        "EZ Bar Curl",
        "Reverse Curl",
        "Cable Curl",
        "Barbell Curl",
      ],
    },
    {
      name: "Tricep Pulldown",
      muscles: ["Tricep", "Deltoids", "Lattisimus Dorsi"],
    },
    {
      name: "Pectoral Fly",
      muscles: ["Pectorals"],
      variants: ["Seated Pectoral Fly", "Machine Pectoral Fly"],
    },
    {
      name: "Lateral Raise",
      muscles: ["Lattisimus Dorsi", "Deltoids"],
      variants: [
        "Dumbbell Lateral Raise",
        "Cable Lateral Raise",
        "Machine Lateral Raise",
      ],
    },
    {
      name: "Leg Press",
      muscles: ["Quadriceps", "Hamstrings", "Glutes"],
      variants: [
        "45 Degree Leg Press",
        "Horizontal Leg Press",
        "Vertical Leg Press",
      ],
    },
    {
      name: "Leg Curl",
      muscles: ["Hamstrings"],
      variants: ["Seated Leg Curl", "Lying Leg Curl", "Standing Leg Curl"],
    },
    {
      name: "Leg Extension",
      muscles: ["Quadriceps"],
    },
    {
      name: "Shoulder Press",
      muscles: ["Deltoids", "Triceps", "Trapezius"],
      variants: [
        "Barbell Shoulder Press",
        "Dumbbell Shoulder Press",
        "Machine Shoulder Press",
        "Smith Machine Shoulder Press",
      ],
    },
    {
      name: "Pull Up",
      muscles: ["Lattisimus Dorsi", "Biceps", "Trapezius"],
      variants: ["Chin Up", "Neutral Grip Pull Up", "Wide Grip Pull Up"],
    },
    {
      name: "Row",
      muscles: ["Lattisimus Dorsi", "Biceps", "Trapezius"],
      variants: ["Bent Over Row", "Seated Row", "Cable Row", "Machine Row"],
    },
    {
      name: "Skull Crusher",
      muscles: ["Triceps"],
      variants: [
        "EZ Bar Skull Crusher",
        "Dumbbell Skull Crusher",
        "Cable Skull Crusher",
      ],
    },
    {
      name: "Back Extension",
      muscles: ["Spinal Erectors", "Glutes"],
      variants: ["Machine Back Extension", "Bodyweight Back Extension"],
    },
    {
      name: "Dips",
      muscles: ["Triceps", "Chest", "Shoulders"],
      variants: ["Machine Dips", "Bodyweight Dips"],
    },
  ],
};

export default exerciseCatalog;
