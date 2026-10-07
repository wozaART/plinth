"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { GalleryRuntimeConfig } from "@/lib/gallery-runtime-config";

const GalleryConfigContext = createContext<GalleryRuntimeConfig | null>(null);

export function GalleryConfigProvider({ value, children }: { value: GalleryRuntimeConfig; children: ReactNode }) {
  return <GalleryConfigContext.Provider value={value}>{children}</GalleryConfigContext.Provider>;
}

export function useGalleryConfig(): GalleryRuntimeConfig {
  const value = useContext(GalleryConfigContext);
  if (!value) throw new Error("useGalleryConfig must be used within a GalleryConfigProvider");
  return value;
}
