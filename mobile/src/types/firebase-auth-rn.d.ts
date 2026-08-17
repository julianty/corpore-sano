// firebase/auth's published types omit getReactNativePersistence — it's only
// declared in @firebase/auth's RN-specific dist (dist/rn/index.js). Metro
// resolves that dist at runtime (via mobile/metro.config.js's
// unstable_enablePackageExports: false, which forces legacy main-field
// resolution through to the RN build), so this is a types-only gap, not a
// runtime one. This augments the types to match, without touching runtime
// resolution.
import type { AsyncStorageStatic } from "@react-native-async-storage/async-storage";

declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: AsyncStorageStatic
  ): Persistence;
}
