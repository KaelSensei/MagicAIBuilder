/**
 * A deck-folder name as the library shows it: the five colour tokens drawn as mana symbols.
 *
 * Deck library (I-01). "{W}{U} Control" shows the white and blue mana symbols, each with its
 * letter, then "Control". Assistive technology reads "W U Control", never the braces: the drawn
 * name is hidden from it and a visually hidden copy carries the readable name, so `ManaSymbol`'s
 * own `{W}` label is left untouched for its other callers. A name without a colour token renders
 * as plain text, exactly as typed. Use it only where an element can hold markup; a native
 * `<option>` keeps the name as typed.
 *
 * @module components/deck/FolderName
 */
import { ManaSymbol } from "@/components/card/ManaSymbol";
import {
  readableFolderName,
  tokenizeFolderName,
  type FolderNamePart,
} from "@/lib/mana/folder-name";

/** Props of {@link FolderName}. */
interface FolderNameProps {
  /** The folder name as stored, unchanged. */
  readonly name: string;
}

function DrawnPart({ part }: { readonly part: FolderNamePart }) {
  if (part.kind === "text") return <span>{part.text}</span>;
  return <ManaSymbol token={{ kind: "color", color: part.color }} />;
}

/**
 * Renders a folder name, drawing `{W}`, `{U}`, `{B}`, `{R}` and `{G}` as mana symbols.
 *
 * Every other brace sequence stays as typed. Inline, so it fits inside a button or a label.
 */
export function FolderName({ name }: FolderNameProps) {
  const parts = tokenizeFolderName(name);
  if (!parts.some((part) => part.kind === "mana")) return name;
  return (
    <>
      <span aria-hidden="true" className="inline-flex items-center gap-1">
        {parts.map((part) => (
          <DrawnPart key={part.start} part={part} />
        ))}
      </span>
      <span className="sr-only">{readableFolderName(parts)}</span>
    </>
  );
}
