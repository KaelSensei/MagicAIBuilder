/**
 * The Lumen segmented control: a named group of toggle buttons on a pill
 * track, one of them chosen. It replaces the hand-made view, density, theme,
 * search-mode and import-source toggles (design audit S3, 2026-11-25).
 *
 * Shared kernel (app shell), free of next-intl like `Button`: the caller
 * passes translated labels.
 *
 * Why it looks the way it does:
 * - The chosen option is raised onto `--surface` and outlined in `--border`,
 *   so it never relies on colour alone (WCAG 2.2 SC 1.4.1,
 *   https://www.w3.org/TR/WCAG22/#use-of-color, read 2026-11-26). The outline
 *   measures 4.13:1 on the dark track (`--background`) and 3.38:1 on the light
 *   one, above the 3:1 of SC 1.4.11
 *   (https://www.w3.org/TR/WCAG22/#non-text-contrast, read 2026-11-26);
 *   `src/styles/contrast.test.ts` holds `--border` to 3:1 on every surface.
 *   The old theme toggle changed only its icon colour, 1.18:1 apart.
 * - The outline is a resting `ring`, drawn only while the option is chosen.
 *   Keyboard focus stays the shared `--focus-ring` outline that the base layer
 *   of `globals.css` draws on every native button.
 * - Every option is at least 28 px square, above the 24 px of SC 2.5.8
 *   (https://www.w3.org/TR/WCAG22/#target-size-minimum, read 2026-11-26).
 * - Each option exposes `aria-pressed`, so a screen reader says whether it is
 *   chosen (SC 4.1.2).
 *
 * @module components/ui/SegmentedControl
 */
import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

/** What an option shows, besides its label. */
type OptionFace =
  | {
      /** Drawn before the label, hidden from screen readers. */
      readonly icon?: ReactNode;
      readonly hideLabel?: false;
    }
  | {
      /**
       * The option's only visible content, hidden from screen readers: an
       * icon, or a short mark such as a number.
       */
      readonly icon: ReactNode;
      /** Reads the label to screen readers only; the icon stands for it. */
      readonly hideLabel: true;
    };

/**
 * One choice of a segmented control. `label` is the option's accessible name;
 * with `hideLabel`, it is read to screen readers only and `icon` is shown.
 */
export type SegmentedOption<T extends string> = {
  /** The value reported to `onChange`; unique within the control. */
  readonly value: T;
  /** The translated name of the option. */
  readonly label: string;
} & OptionFace;

/** The target size of every option: 28 px at `sm`, 32 px at `md`. */
export type SegmentedControlSize = "sm" | "md";

/** Props of {@link SegmentedControl}. */
export interface SegmentedControlProps<T extends string> {
  /** The choices, in display order. */
  readonly options: readonly SegmentedOption<T>[];
  /** The chosen option's value. */
  readonly value: T;
  /**
   * Called with the pressed option's value, on every press, the chosen
   * option included: the builder's search tabs start afresh when the open
   * tab is pressed again.
   */
  readonly onChange: (value: T) => void;
  /** The translated name of the group. */
  readonly "aria-label": string;
  /** Target size of the options; `sm` by default. */
  readonly size?: SegmentedControlSize;
  /** Stretches the track to its container and shares the width equally. */
  readonly fullWidth?: boolean;
  /** Layout classes for the track (margin, width, a border). */
  readonly className?: string;
}

const TRACK_CLASS_NAME =
  "items-center gap-0.5 rounded-[var(--lumen-radius-pill)] bg-[var(--background)] p-0.5";

/**
 * An option at rest and, through `data-state="on"`, chosen. The ring is the
 * chosen marker, never a focus style: focus is the base layer's outline.
 */
const OPTION_CLASS_NAME =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--lumen-radius-pill)] text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] data-[state=on]:bg-[var(--surface)] data-[state=on]:font-medium data-[state=on]:text-[var(--text-primary)] data-[state=on]:shadow-[var(--lumen-shadow-sm)] data-[state=on]:ring-1 data-[state=on]:ring-inset data-[state=on]:ring-[var(--border)]";

const SIZE_CLASS_NAME: Readonly<Record<SegmentedControlSize, string>> = {
  sm: "min-h-7 min-w-7 px-2",
  md: "min-h-8 min-w-8 px-3",
};

/**
 * A named group of toggle buttons, one of them chosen: a `fieldset`, whose
 * implicit role is `group`, holding one `<button type="button" aria-pressed>`
 * per option.
 *
 * @param props - the options, the chosen value, the change handler and the
 *   group's name; see {@link SegmentedControlProps}
 * @example
 * <SegmentedControl
 *   aria-label={t("viewMode.layout")}
 *   options={[
 *     { value: "list", label: t("viewMode.listView"), icon: <List />, hideLabel: true },
 *     { value: "grid", label: t("viewMode.gridView"), icon: <LayoutGrid />, hideLabel: true },
 *   ]}
 *   value={viewMode}
 *   onChange={setViewMode}
 * />
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  size = "sm",
  fullWidth = false,
  className,
}: Readonly<SegmentedControlProps<T>>) {
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        TRACK_CLASS_NAME,
        fullWidth ? "flex w-full" : "inline-flex",
        className
      )}
    >
      {options.map((option) => {
        const chosen = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={chosen}
            data-state={chosen ? "on" : "off"}
            onClick={() => onChange(option.value)}
            className={cn(
              OPTION_CLASS_NAME,
              SIZE_CLASS_NAME[size],
              fullWidth && "flex-1"
            )}
          >
            {option.icon !== undefined && (
              <span aria-hidden="true" className="inline-flex">
                {option.icon}
              </span>
            )}
            <span className={option.hideLabel ? "sr-only" : undefined}>
              {option.label}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
