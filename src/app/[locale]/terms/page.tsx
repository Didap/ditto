import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold tracking-tight text-(--ditto-text) mb-2">
        Terms and Conditions
      </h1>
      <p className="text-sm text-(--ditto-text-muted) mb-10">
        Last updated: April 2026
      </p>

      <div className="prose-ditto space-y-8 text-sm text-(--ditto-text-secondary) leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">1. Acceptance of Terms</h2>
          <p>
            By creating an account or using Ditto, you agree to be bound by these Terms and Conditions.
            If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">2. Service Description</h2>
          <p>
            Ditto is a design system extraction and generation tool. It allows users to reverse-engineer
            design systems from websites, browse a curated catalog of design styles, and download
            design kits and Storybook projects.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">3. Credits and Purchases</h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Credits are the virtual currency used within Ditto to unlock features and downloads.</li>
            <li>Credit purchases are processed via Stripe and are non-refundable once used.</li>
            <li>Unlocking a download (Kit or Storybook) grants access for 15 days from the time of purchase.</li>
            <li>Once credits are spent on a download, the transaction is final and cannot be reversed.</li>
            <li>Unused credits on your account remain available with no expiration.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">4. Intellectual Property</h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              Designs extracted from websites are derivative analyses of publicly available CSS.
              Ditto does not claim ownership of the original designs.
            </li>
            <li>
              Catalog designs are curated style references. They describe visual aesthetics and
              do not reproduce or distribute any third-party trademarks, logos, or copyrighted assets.
            </li>
            <li>
              Generated outputs (Kit, Storybook, DESIGN.md) are tools for your own projects.
              You are responsible for ensuring your use does not infringe on third-party rights.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">5. User Responsibilities</h2>
          <p>
            You agree not to use Ditto to replicate or distribute designs in a way that infringes
            on the intellectual property rights of others. Ditto provides design tokens and style
            references as creative tools, not as authorization to copy protected works.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">6. Limitation of Liability</h2>
          <p>
            Ditto is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
            damages arising from the use of generated design outputs, including but not limited to
            intellectual property disputes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">7. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
            Upon termination, unused credits are forfeited.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">8. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of Ditto after changes constitutes
            acceptance of the new terms. We will notify users of significant changes via email
            or in-app notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">9. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:support@ditto.design" className="text-(--ditto-primary) underline underline-offset-2">
              support@ditto.design
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
