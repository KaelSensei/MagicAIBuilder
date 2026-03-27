/** Visual "or" divider between OAuth and credentials sections on auth pages. */
export function AuthDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[var(--border)]" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-2 bg-[var(--background)] text-[var(--text-secondary)]">
          or
        </span>
      </div>
    </div>
  );
}
