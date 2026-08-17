// firebase/auth's published types omit getReactNativePersistence — it's only
// declared in @firebase/auth's RN-specific dist (dist/rn/index.js), which is
// what Metro actually resolves at runtime (see docs/launch-readiness-2026-08-17.md
// LR-08). This augments the types to match, without touching runtime resolution.
import type { AsyncStorageStatic } from "@react-native-async-storage/async-storage";

declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: AsyncStorageStatic
  ): Persistence;
}
