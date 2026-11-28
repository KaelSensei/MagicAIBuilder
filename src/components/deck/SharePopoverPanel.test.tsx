/**
 * The share panel's link field leaves the app's keyboard-focus outline
 * visible.
 *
 * Design audit S1 (2026-11-25): the read-only link field hid its outline and
 * drew no other focus style, so a keyboard player tabbing to it to copy the
 * link could not see that it had focus. The outline itself comes from the
 * base layer of `globals.css`.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ShareLinkState } from "@/hooks/useShareLink";
import { HIDES_FOCUS_OUTLINE } from "@/test/focus-outline";
import { renderWithIntl } from "@/test/render-with-intl";
import { SharePopoverPanel } from "./SharePopoverPanel";

const LIVE_LINK: ShareLinkState = {
  isEnabled: true,
  shareUrl: "https://example.test/share/abc",
  loading: false,
  enable: () => Promise.resolve(),
  revoke: () => Promise.resolve(),
};

describe("SharePopoverPanel", () => {
  it("leaves the app's focus outline visible on the share link field", () => {
    renderWithIntl(
      <SharePopoverPanel
        id="share"
        link={LIVE_LINK}
        onClose={() => undefined}
      />
    );

    expect(
      screen.getByRole("textbox", { name: "Share link" }).className
    ).not.toMatch(HIDES_FOCUS_OUTLINE);
  });
});
