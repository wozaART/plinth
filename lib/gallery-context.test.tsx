// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { galleryConfig } from "@/test/gallery-config";
import { GalleryConfigProvider, useGalleryConfig } from "./gallery-context";

describe("gallery context", () => {
  it("provides the config to descendants", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <GalleryConfigProvider value={galleryConfig}>{children}</GalleryConfigProvider>;
    const { result } = renderHook(() => useGalleryConfig(), { wrapper });
    expect(result.current).toBe(galleryConfig);
  });

  it("renders its children", () => {
    render(<GalleryConfigProvider value={galleryConfig}><p>inside</p></GalleryConfigProvider>);
    expect(screen.getByText("inside")).toBeTruthy();
  });

  it("throws a helpful error outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useGalleryConfig())).toThrow("useGalleryConfig must be used within a GalleryConfigProvider");
    spy.mockRestore();
  });
});
