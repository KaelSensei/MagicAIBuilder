"use client";
// Small author chip: avatar (or placeholder) plus a profile link when one exists.
import { Link } from "@/i18n/navigation";
import { User } from "lucide-react";

export interface UserChipProps {
  readonly name: string | null;
  readonly username: string | null;
  readonly image: string | null;
}

export function UserChip({ name, username, image }: UserChipProps) {
  const displayName = name ?? username ?? "Anonymous";

  return (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="w-6 h-6 rounded-full object-cover border border-[var(--border)]"
        />
      ) : (
        <span className="w-6 h-6 rounded-full border border-[var(--border)] bg-[var(--background)] flex items-center justify-center">
          <User className="w-3 h-3 text-[var(--text-secondary)]" aria-hidden="true" />
        </span>
      )}
      {username ? (
        <Link
          href={`/u/${username}`}
          className="text-sm text-[var(--text-primary)] hover:text-[var(--accent-text)]"
        >
          {displayName}
        </Link>
      ) : (
        <span className="text-sm text-[var(--text-primary)]">{displayName}</span>
      )}
    </>
  );
}
