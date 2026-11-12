/**
 * A localized link dressed as a Lumen button, for calls to action that
 * navigate rather than act.
 *
 * Shared kernel (app shell). It takes next-intl's `Link` props plus the
 * `Button` variants, and renders the same class list as the `Button` of that
 * variant and size, so the landing's pills and the app's buttons share one
 * source (master plan P1-50). Kept apart from `Button.tsx` so that rendering a
 * button never loads next-intl's navigation.
 *
 * @module components/ui/ButtonLink
 */
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/components/ui/utils";
import {
  buttonVariants,
  type ButtonVariantProps,
} from "@/components/ui/Button";

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonVariantProps;

/**
 * Renders a localized link with the Lumen pill's classes; primary and small
 * when no variant or size is given. The caller's `className` comes last, so
 * a spacing utility it adds replaces the pill's own through `cn`.
 *
 * @param props - next-intl `Link` props plus `variant` and `size`
 */
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: Readonly<ButtonLinkProps>) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
