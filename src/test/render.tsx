/**
 * The shared render helper of the test kit: mounts a component inside the providers the app wraps
 * every page in, so a test file does not hand-roll its own.
 *
 * - next-intl, with the real catalogs of the chosen locale, every namespace (`intl-catalogs.ts`),
 *   and the time zone pinned to UTC.
 * - TanStack Query, with a fresh client per render that never retries, so a failed request fails
 *   at once and no cache leaks from one test to the next.
 * - Auth.js's `SessionProvider`, only when the test passes `session`.
 *
 * `renderHookWithProviders` runs a hook inside the same providers. `renderWithIntl` stays for tests
 * that need next-intl alone; it reads the same catalogs.
 *
 * @module test/render
 */
import {
  render,
  renderHook,
  type RenderHookResult,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { testMessages, type TestLocale } from "@/test/intl-catalogs";

export { renderWithIntl } from "@/test/render-with-intl";
export type { TestLocale } from "@/test/intl-catalogs";

/** What `renderWithProviders` takes on top of Testing Library's own render options. */
export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  "wrapper"
> {
  /** Locale to render under. Defaults to `en`. */
  readonly locale?: TestLocale;
  /**
   * The Auth.js session `useSession` reads: a signed-in player, or `null` for a guest. Left out,
   * no `SessionProvider` is mounted, and a component that calls `useSession` throws, as it would
   * in the app outside the root layout.
   */
  readonly session?: Session | null;
  /** A client the test prepared, for example with seeded data. Defaults to a fresh one. */
  readonly queryClient?: QueryClient;
}

/** The usual render result, plus the query client the component reads. */
export interface RenderWithProvidersResult extends RenderResult {
  readonly queryClient: QueryClient;
}

/** The usual `renderHook` result, plus the query client the hook reads. */
export interface RenderHookWithProvidersResult<
  Result,
  Props,
> extends RenderHookResult<Result, Props> {
  readonly queryClient: QueryClient;
}

/**
 * A query client for one test: no retries, so an error reaches the component on the first failure,
 * as every hand-rolled test client in the suite did.
 *
 * @returns a client with an empty cache
 */
export function aTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** The wrapper both helpers pass to Testing Library, and the client it provides. */
function providersFor(options: RenderWithProvidersOptions): {
  readonly Providers: (props: { readonly children: ReactNode }) => ReactElement;
  readonly queryClient: QueryClient;
} {
  const { locale = "en", session, queryClient = aTestQueryClient() } = options;

  function Providers({ children }: { readonly children: ReactNode }) {
    const app = (
      <NextIntlClientProvider
        locale={locale}
        timeZone="UTC"
        messages={testMessages(locale)}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NextIntlClientProvider>
    );
    return session === undefined ? (
      app
    ) : (
      <SessionProvider session={session}>{app}</SessionProvider>
    );
  }

  return { Providers, queryClient };
}

/**
 * Renders a component inside next-intl, TanStack Query and, when asked, Auth.js.
 *
 * The providers are passed as Testing Library's `wrapper`, so `rerender` keeps them and the same
 * query client.
 *
 * @param ui - element under test
 * @param options - `locale`, `session` and `queryClient`, plus Testing Library's render options
 * @returns the render result and the query client
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  const { locale, session, queryClient, ...renderOptions } = options;
  const providers = providersFor({ locale, session, queryClient });
  return {
    ...render(ui, { ...renderOptions, wrapper: providers.Providers }),
    queryClient: providers.queryClient,
  };
}

/**
 * Runs a hook inside the same providers as `renderWithProviders`.
 *
 * @param hook - the hook call under test, as Testing Library's `renderHook` takes it
 * @param options - `locale`, `session` and `queryClient`
 * @returns the `renderHook` result and the query client
 */
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options: Pick<
    RenderWithProvidersOptions,
    "locale" | "session" | "queryClient"
  > = {}
): RenderHookWithProvidersResult<Result, Props> {
  const providers = providersFor(options);
  return {
    ...renderHook(hook, { wrapper: providers.Providers }),
    queryClient: providers.queryClient,
  };
}
