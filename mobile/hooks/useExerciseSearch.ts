import { useMemo } from "react";
import exerciseCatalogUpdated from "@shared/data/exerciseCatalogUpdated";

export interface ExerciseSection {
  title: string;
  data: string[];
  isCustom?: boolean;
}

const ALL_CATALOG_SECTIONS: ExerciseSection[] = exerciseCatalogUpdated.data.map((e) => ({
  title: e.name,
  data: e.variants ?? [],
}));

export function useExerciseSearch(
  search: string,
  customExercises: Record<string, { name: string; muscleGroup: string | null }>,
) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const customNames = Object.values(customExercises).map((e) => e.name);
    const filteredCustom = q
      ? customNames.filter((n) => n.toLowerCase().includes(q))
      : customNames;
    const filteredCatalog = q
      ? ALL_CATALOG_SECTIONS.map((section) => ({
          ...section,
          data: section.data.filter(
            (v) =>
              v.toLowerCase().includes(q) ||
              section.title.toLowerCase().includes(q),
          ),
        })).filter((s) => s.data.length > 0)
      : ALL_CATALOG_SECTIONS;
    const sections: ExerciseSection[] = [];
    if (filteredCustom.length > 0) {
      sections.push({ title: "My Exercises", data: filteredCustom, isCustom: true });
    }
    return [...sections, ...filteredCatalog];
  }, [search, customExercises]);

  const trimmed = search.trim();
  const showAddCustom =
    trimmed.length > 0 &&
    !Object.values(customExercises).some(
      (e) => e.name.toLowerCase() === trimmed.toLowerCase(),
    ) &&
    !ALL_CATALOG_SECTIONS.some((s) =>
      s.data.some((v) => v.toLowerCase() === trimmed.toLowerCase()),
    );

  return { filtered, trimmed, showAddCustom };
}
