import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardFlip } from "./useCardFlip";
import type { CardFace } from "@/lib/deck/types";

const front: CardFace = {
  name: "Shatterskull Smashing",
  manaCost: "{X}{R}{R}",
  typeLine: "Sorcery",
  oracleText: "Deals X damage.",
  imageUri: "https://example.com/front.jpg",
  artCropUri: "",
};
const back: CardFace = {
  name: "Shatterskull, the Hammer Pass",
  manaCost: "",
  typeLine: "Land",
  oracleText: "",
  imageUri: "https://example.com/back.jpg",
  artCropUri: "",
};

describe("useCardFlip", () => {
  it("canFlip is false when no faces provided", () => {
    const { result } = renderHook(() => useCardFlip(undefined));
    expect(result.current.canFlip).toBe(false);
    expect(result.current.currentFace).toBeNull();
  });

  it("canFlip is true when two faces provided", () => {
    const { result } = renderHook(() => useCardFlip([front, back]));
    expect(result.current.canFlip).toBe(true);
  });

  it("shows front face initially", () => {
    const { result } = renderHook(() => useCardFlip([front, back]));
    expect(result.current.currentFace).toBe(front);
    expect(result.current.isFlipped).toBe(false);
  });

  it("shows back face after toggle", () => {
    const { result } = renderHook(() => useCardFlip([front, back]));
    act(() => { result.current.toggle(); });
    expect(result.current.isFlipped).toBe(true);
    expect(result.current.currentFace).toBe(back);
  });

  it("returns to front face after toggling twice", () => {
    const { result } = renderHook(() => useCardFlip([front, back]));
    act(() => { result.current.toggle(); });
    act(() => { result.current.toggle(); });
    expect(result.current.isFlipped).toBe(false);
  });

  it("toggle reference is stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useCardFlip([front, back]));
    const t = result.current.toggle;
    rerender();
    expect(result.current.toggle).toBe(t);
  });
});
