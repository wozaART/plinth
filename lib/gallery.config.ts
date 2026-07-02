import type { GalleryConfig } from "./gallery-config.types";
import { defaultConfig } from "./galleries/default.config";
import { jvhConfig } from "./galleries/jvh.config";

export type { GalleryConfig } from "./gallery-config.types";

const CONFIGS = {
  default: defaultConfig,
  jvh: jvhConfig,
} as const;

const key = (process.env.NEXT_PUBLIC_GALLERY ?? "default") as keyof typeof CONFIGS;

export const galleryConfig: GalleryConfig = CONFIGS[key] ?? defaultConfig;
