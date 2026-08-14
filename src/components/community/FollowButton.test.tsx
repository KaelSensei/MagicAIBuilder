import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enProfile from "@/messages/en/profile.json";
import { FollowButton } from "./FollowButton";

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ profile: enProfile }}>
      {ui}
    </NextIntlClientProvider>
  );
}

const defaultProps = {
  username: "kael",
  initialFollowing: false,
  initialFollowerCount: 4,
  canFollow: true,
};

function mockFetch(response: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FollowButton", () => {
  it("shows a sign-in prompt instead of the button for anonymous viewers", () => {
    renderWithIntl(<FollowButton {...defaultProps} canFollow={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/sign in to follow/i)).toBeInTheDocument();
    expect(screen.getByText(/4 followers/i)).toBeInTheDocument();
  });

  it("renders the follow action with the current follower count", () => {
    renderWithIntl(<FollowButton {...defaultProps} />);

    expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
    expect(screen.getByText(/4 followers/i)).toBeInTheDocument();
  });

  it("POSTs and reflects the server count when following", async () => {
    const fetchMock = mockFetch({ following: true, followerCount: 5 });
    const user = userEvent.setup();
    renderWithIntl(<FollowButton {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /following/i })).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/community/users/kael/follow",
      expect.objectContaining({ method: "POST" })
    );
    expect(screen.getByText(/5 followers/i)).toBeInTheDocument();
  });

  it("DELETEs when unfollowing", async () => {
    const fetchMock = mockFetch({ following: false, followerCount: 3 });
    const user = userEvent.setup();
    renderWithIntl(<FollowButton {...defaultProps} initialFollowing />);

    await user.click(screen.getByRole("button", { name: /following/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/users/kael/follow",
        expect.objectContaining({ method: "DELETE" })
      );
    });
    expect(screen.getByText(/3 followers/i)).toBeInTheDocument();
  });

  it("rolls back the optimistic update and warns when the request fails", async () => {
    mockFetch({}, false);
    const user = userEvent.setup();
    renderWithIntl(<FollowButton {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not update follow/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /^follow$/i })).toBeInTheDocument();
    expect(screen.getByText(/4 followers/i)).toBeInTheDocument();
  });

  it("encodes the username in the request URL", async () => {
    const fetchMock = mockFetch({ following: true, followerCount: 1 });
    const user = userEvent.setup();
    renderWithIntl(<FollowButton {...defaultProps} username="a b" />);

    await user.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/users/a%20b/follow",
        expect.anything()
      );
    });
  });
});
