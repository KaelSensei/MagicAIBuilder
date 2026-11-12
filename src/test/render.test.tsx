/**
 * Pins `renderWithProviders`, the shared render helper of the test kit: the providers a component
 * of this app needs to mount (next-intl, TanStack Query, optionally Auth.js), set up the same way
 * in every test file.
 */
import { screen } from "@testing-library/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { describe, expect, it } from "vitest";
import { testMessages } from "@/test/intl-catalogs";
import {
  renderHookWithProviders,
  renderWithIntl,
  renderWithProviders,
} from "@/test/render";

/** Reads one key from a few namespaces of the app's request config, `auth` included. */
function CatalogProbe() {
  const auth = useTranslations("auth.signIn");
  const deck = useTranslations("deck");
  const playtestEvidence = useTranslations(
    "playtestEvidence.drawProgress.status"
  );
  const commanderRules = useTranslations("commanderRules");
  return (
    <ul>
      <li>{useLocale()}</li>
      <li>{auth("submit")}</li>
      <li>{deck("publicLoading")}</li>
      <li>{playtestEvidence("natural")}</li>
      <li>{commanderRules("title")}</li>
    </ul>
  );
}

function QueryProbe() {
  const client = useQueryClient();
  const answer = useQuery({
    queryKey: ["probe"],
    queryFn: () => Promise.reject(new Error("refused")),
  });
  return (
    <p>
      {answer.status} retries:
      {String(client.getDefaultOptions().queries?.retry)}
    </p>
  );
}

function SessionProbe() {
  const session = useSession();
  return <p>{session.data?.user?.name ?? session.status}</p>;
}

describe("renderWithProviders", () => {
  it("renders with every namespace of the English catalogs, auth included, by default", () => {
    renderWithProviders(<CatalogProbe />);

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent)
    ).toEqual([
      "en",
      "Sign In",
      "Loading deck...",
      "Natural draws only.",
      "Cards that can't work with this commander",
    ]);
  });

  it("renders with the French catalogs when asked", () => {
    renderWithProviders(<CatalogProbe />, { locale: "fr" });

    const [locale, submit] = screen.getAllByRole("listitem");
    expect(locale.textContent).toBe("fr");
    expect(submit.textContent).toBe("Se connecter");
  });

  it("gives each render its own query client, which does not retry, and returns it", async () => {
    const first = renderWithProviders(<QueryProbe />);
    expect(await screen.findByText("error retries:false")).toBeDefined();
    first.unmount();

    const second = renderWithProviders(<QueryProbe />);

    expect(second.queryClient).not.toBe(first.queryClient);
    expect(second.queryClient.getQueryCache().getAll()).toHaveLength(1);
  });

  it("keeps the providers and the query client when the test rerenders", () => {
    const view = renderWithProviders(<CatalogProbe />, { locale: "fr" });
    const client = view.queryClient;

    view.rerender(<CatalogProbe />);

    expect(screen.getAllByRole("listitem")[0].textContent).toBe("fr");
    expect(view.queryClient).toBe(client);
  });

  it("mounts Auth.js only when a session is given: a player, or null for a guest", () => {
    const player = renderWithProviders(<SessionProbe />, {
      session: {
        user: { id: "player-1", name: "Kael" },
        expires: "2099-01-01T00:00:00.000Z",
      },
    });
    expect(screen.getByText("Kael")).toBeDefined();
    player.unmount();

    renderWithProviders(<SessionProbe />, { session: null });
    expect(screen.getByText("unauthenticated")).toBeDefined();
  });
});

describe("renderHookWithProviders", () => {
  it("runs a hook inside the same providers, in the chosen locale, and returns its query client", async () => {
    const { result, queryClient } = renderHookWithProviders(
      () => ({
        locale: useLocale(),
        retry: useQueryClient().getDefaultOptions().queries?.retry,
      }),
      { locale: "fr" }
    );

    expect(result.current).toEqual({ locale: "fr", retry: false });
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
  });
});

describe("renderWithIntl, kept for intl-only tests", () => {
  it("renders with the same catalogs, auth included", () => {
    renderWithIntl(<CatalogProbe />);

    expect(screen.getAllByRole("listitem")[1].textContent).toBe("Sign In");
  });

  it("keeps the provider when the test rerenders", () => {
    const view = renderWithIntl(<CatalogProbe />, { locale: "fr" });

    view.rerender(<CatalogProbe />);

    const [locale, submit] = screen.getAllByRole("listitem");
    expect(locale.textContent).toBe("fr");
    expect(submit.textContent).toBe("Se connecter");
  });

  it("renders with the catalogs a test passes, so it can prove a text comes from the catalog", () => {
    const en = testMessages("en");
    const auth = en.auth;
    if (typeof auth !== "object" || typeof auth.signIn !== "object") {
      throw new TypeError("the en auth catalog has no signIn block");
    }
    const messages = {
      ...en,
      auth: { ...auth, signIn: { ...auth.signIn, submit: "Come in" } },
    };

    renderWithIntl(<CatalogProbe />, { messages });

    expect(screen.getAllByRole("listitem")[1].textContent).toBe("Come in");
  });
});
