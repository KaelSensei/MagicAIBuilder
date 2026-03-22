"use client";
// Shared clipboard hook — copied state resets after 2 s
import { useState } from "react";

/** Returns [copied, copy] — `copied` resets to false after 2 s */
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  };

  return [copied, copy];
}
