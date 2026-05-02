export const metadata = {
  title: "Privacy Policy — Nesos",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper-cream px-6 py-16">
      <div className="max-w-2xl mx-auto">

        <a
          href="/planner"
          className="text-xs uppercase tracking-[0.2em] text-paper-ink-light hover:text-paper-ink transition-colors mb-10 inline-block"
          style={{ fontFamily: "var(--font-body)" }}
        >
          ← Back to Nesos
        </a>

        <h1
          className="text-4xl font-bold tracking-tight text-paper-ink mt-2 mb-2"
          style={{ fontFamily: "var(--font-aboreto)" }}
        >
          Nesos
        </h1>
        <p
          className="text-sm text-paper-ink-light mb-10"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        >
          Privacy Policy · Effective April 30, 2026
        </p>

        <div
          className="space-y-8 text-paper-ink leading-relaxed"
          style={{ fontFamily: "var(--font-serif)", fontSize: "15px" }}
        >
          <section>
            <h2 className="text-base font-semibold uppercase tracking-widest text-paper-ink mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "11px" }}>
              What we collect
            </h2>
            <p>
              When you sign in with Google, Nesos receives your name and email address from Google. We store this to identify your account and scope your data.
            </p>
            <p className="mt-3">
              We also store content you create within the app: tasks, goals, projects, notes, calendar sessions, and any other planning data you enter. This content is associated with your email address and stored in a secure database.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold uppercase tracking-widest text-paper-ink mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "11px" }}>
              How we store it
            </h2>
            <p>
              Your data is stored in a PostgreSQL database hosted by Supabase. It is scoped entirely to your email address — no other user can access your data. We do not use shared or pooled data structures.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold uppercase tracking-widest text-paper-ink mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "11px" }}>
              What we do not do
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not sell, share, or rent your data to any third party.</li>
              <li>We do not use your data to train machine learning models.</li>
              <li>We do not display advertising.</li>
              <li>We do not track your behavior across other websites or apps.</li>
            </ul>
            <p className="mt-3">
              Basic hosting analytics (page visit counts, error logs) may be collected by Vercel, our hosting provider, in aggregate and anonymous form. No personal data is involved.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold uppercase tracking-widest text-paper-ink mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "11px" }}>
              Deleting your data
            </h2>
            <p>
              You can permanently delete your account and all associated data at any time from within the app. Open the menu (···) in the top right corner and choose "Delete account." This action is immediate and irreversible — all your tasks, goals, projects, and notes will be removed from our database.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold uppercase tracking-widest text-paper-ink mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "11px" }}>
              Contact
            </h2>
            <p>
              Questions about this policy or your data can be sent to{" "}
              <a
                href="mailto:nesosplanner@gmail.com"
                className="underline underline-offset-2 hover:text-paper-ink-light transition-colors"
              >
                nesosplanner@gmail.com
              </a>
              .
            </p>
          </section>

          <hr className="border-paper-line/40 mt-10" />
          <p className="text-xs text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>
            This policy may be updated as the app evolves.
          </p>
        </div>
      </div>
    </div>
  );
}
