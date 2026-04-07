import Link from "next/link";

/** Final call-to-action with gradient text and glow background */
export function FinalCta() {
  return (
    <section className="landing-final-cta">
      <h2 className="reveal">
        Your Next Win
        <br />
        Starts <span>Right Here.</span>
      </h2>
      <p className="reveal">
        Stop second-guessing your card choices. Build the deck you meant to
        build &mdash; and win with it.
      </p>
      <Link href="/auth/signin" className="btn-primary reveal">
        {"\u2726"} Start Building Now
      </Link>
    </section>
  );
}
