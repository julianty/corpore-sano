import React from "react";
import { Skeleton, Stack, Group, Center, Box, Loader } from "@mantine/core";

interface LoadingOverlayProps {
  /**
   * Whether the loading state is active
   */
  isLoading?: boolean;

  /**
   * Type of loading indicator
   * 'spinner' - animated spinner
   * 'skeleton' - skeleton placeholder
   */
  type?: "spinner" | "skeleton";

  /**
   * Number of skeleton lines to show (for skeleton type)
   */
  skeletonLines?: number;

  /**
   * Custom children to show while loading
   */
  children?: React.ReactNode;

  /**
   * Full overlay mode - covers entire parent
   */
  overlay?: boolean;
}

/**
 * Loading Overlay Component
 * Shows loading state with spinner or skeleton placeholder
 * Useful for async operations like data fetching
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = false,
  type = "spinner",
  skeletonLines = 3,
  children,
  overlay = false,
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  // Spinner type
  if (type === "spinner") {
    return (
      <Box
        style={{
          width: overlay ? "100%" : "auto",
          height: overlay ? "100%" : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Center py="xl">
          <Loader aria-label="Loading content" />
        </Center>
      </Box>
    );
  }

  // Skeleton type - shows placeholder bars
  return (
    <Stack gap="md">
      {Array.from({ length: skeletonLines }).map((_, index) => (
        <Skeleton key={index} height={20} radius="md" />
      ))}
    </Stack>
  );
};

interface WorkoutLoadingProps {
  /**
   * Show loading state for workout items
   */
  isLoading?: boolean;

  /**
   * Number of workout items to show as skeleton
   */
  itemCount?: number;
}

/**
 * Workout-specific Loading Component
 * Shows skeleton loading for workout entries
 */
export const WorkoutLoadingState: React.FC<WorkoutLoadingProps> = ({
  isLoading = false,
  itemCount = 3,
}) => {
  if (!isLoading) return null;

  return (
    <Stack gap="md">
      {Array.from({ length: itemCount }).map((_, idx) => (
        <Box
          key={idx}
          p="md"
          style={{
            border: "1px solid var(--mantine-color-gray-2)",
            borderRadius: "8px",
          }}
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Skeleton height={24} width="200px" radius="md" />
              <Skeleton height={24} width="100px" radius="md" />
            </Group>
            <Skeleton height={40} radius="md" />
            <Skeleton height={20} radius="md" />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};

/**
 * Table Row Loading Skeleton
 * Shows placeholder for table loading
 */
export const TableLoadingRow: React.FC<{ columnCount?: number }> = ({
  columnCount = 4,
}) => {
  return (
    <Group justify="space-between" gap="md">
      {Array.from({ length: columnCount }).map((_, idx) => (
        <Skeleton key={idx} height={16} width={`${100 / columnCount}%`} radius="md" />
      ))}
    </Group>
  );
};
