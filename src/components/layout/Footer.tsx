import { KeyboardShortcutsTrigger } from "./KeyboardShortcutsModal";

// Legal footer — displayed on the home page
export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6 mt-auto">
      <div className="max-w-4xl mx-auto space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
        <p>
          Wizards of the Coast, Magic: The Gathering, and their logos are trademarks of Wizards of
          the Coast LLC in the United States and other countries. © 1993-2026 Wizards. All Rights
          Reserved.
        </p>
        <p>
          MagicAIBuilder is not affiliated with, endorsed, sponsored, or specifically approved by
          Wizards of the Coast LLC. MagicAIBuilder may use the trademarks and other intellectual
          property of Wizards of the Coast LLC, which is permitted under Wizards&apos; Fan Site
          Policy. MAGIC: THE GATHERING® is a trademark of Wizards of the Coast. For more
          information about Wizards of the Coast or any of Wizards&apos; trademarks or other
          intellectual property, please visit their website at{" "}
          <a
            href="https://company.wizards.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[var(--text-primary)] transition-colors"
          >
            company.wizards.com
          </a>
          {"."}
        </p>
        <p>
          Some card prices and other card data are provided by Scryfall. Scryfall makes no
          guarantee about its price information and recommends you see stores for final prices and
          details.
        </p>
        <div className="flex items-center justify-end">
          <KeyboardShortcutsTrigger />
        </div>
      </div>
    </footer>
  );
}
