const exerciseCatalog = {
  data: [
    {
      name: "Barbell Squat",
      muscles: ["Quadriceps", "Hamstrings"],
      variants: ["Front Squat", "Hack Squat", "Goblet Squat"],
    },

    {
      name: "Barbell Bench Press",
      muscles: ["Pectorals", "Deltoids"],
      variants: ["Incline Bench Press", "Decline Bench Press"],
    },
    // Probably need to merge conventional deadlift and sumo deadlift together
    {
      name: "Conventional Deadlift",
      muscles: ["Quadriceps", "Hamstrings"],
      variants: ["Dumbbell Deadlift"],
    },
    {
      name: "Sumo Deadlift",
      muscles: ["Quadriceps", "Hamstrings", "Lattisimus Dorsi"],
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
    // Might not need to write "Barbell" in some cases because it's implied
    {
      name: "Incline Bench Press",
      muscles: ["Deltoids", "Pectorals"],
      variants: ["Barbell Incline Bench Press", "Dumbbell Incline Bench Press"],
    },
    {
      name: "Dumbbell Deadlift",
      muscles: ["Quadriceps", "Hamstrings"],
    },
    {
      name: "Tricep Pulldown",
      muscles: ["Tricep", "Deltoids", "Lattisimus Dorsi"],
    },
    {
      name: "Seated Pectoral Fly",
      muscles: ["Pectorals"],
    },
    {
      name: "Lateral Raise",
      muscles: ["Lattisimus Dorsi", "Deltoids"],
    },
  ],
};

// {
//   name:
//   muscles:
// },

// Could add some variants here? like:
// {
//   name: " Squat",
//   muscles: ["Quadriceps", "Hamstrings"],
//   variants: ["Competition Squat", "Front Squat", "Hack Squat", "Goblet Squat", ]
// }

// Exercises to add:
// - Leg Press
// - Leg Curl
// - Leg Extension
// - Shoulder Press
// - Pull Up
// - Chin Up**
// - Bent Over Row
// - Upright Row
// - Skull Crusher
// - Dumbbell Curl**'
// - Back Extension
// - Dips
// - Machine Dips
export default exerciseCatalog;
