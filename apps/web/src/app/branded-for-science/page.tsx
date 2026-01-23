import Link from 'next/link';

export default function BrandedForSciencePage() {
  return (
    <main id="main-content" className="min-h-screen bg-background-primary">
      {/* Header */}
      <section className="py-16 bg-background-secondary border-b border-border">
        <div className="container-default">
          <div className="max-w-3xl">
            <Link href="/" className="text-brand-primary hover:text-brand-light text-sm mb-4 inline-block">
              &larr; Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Branded for Science
            </h1>
            <p className="text-xl text-zinc-400">
              A brand-first, science-first approach to peptide research education, sourcing standards,
              and long-term credibility.
            </p>
          </div>
        </div>
      </section>

      {/* Brand Foundation */}
      <section className="section">
        <div className="container-default">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                A Science-First Brand Built for Trust
              </h2>
              <p className="text-zinc-400">
                Science Based Body Peptides is, first and foremost, a brand. A brand built on credibility,
                restraint, and scientific literacy in a market where trust is often undermined by exaggerated
                claims, opaque sourcing, and short-term hype.
              </p>
              <p className="text-zinc-400">
                Our relevance does not come from volume or novelty. It comes from consistency, transparency,
                and alignment with evidence. We exist to represent a higher standard for how peptide research,
                education, and access are communicated to the public and to medical professionals.
              </p>
            </div>

            <div className="card-glass p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Why We Exist</h3>
              <p className="text-zinc-400 mb-4">
                Biomedical research advances quickly, but reliable interpretation and responsible access remain uneven.
                Peptides sit at the intersection of legitimate scientific interest and widespread public curiosity,
                where misinformation is common.
              </p>
              <p className="text-zinc-400">
                We operate between innovation and discipline, providing U.S.-manufactured, quality-controlled research
                materials and clear educational context without medical claims or speculative marketing. If something
                cannot be responsibly explained, documented, and contextualized, it does not belong under our brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Principles */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Our Brand Principles</h2>
            <p className="section-subtitle">
              The standards that shape what we publish, what we partner on, and what we choose not to claim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Science Before Marketing</h3>
              <p className="text-zinc-400">
                We do not position peptides as treatments or consumer wellness solutions. Our communication
                references published research, distinguishes established findings from emerging work, and
                avoids outcome-driven claims.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Transparency as a Brand Asset</h3>
              <p className="text-zinc-400">
                Trust is demonstrated. We prioritize U.S. manufacturing and testing standards, clear sourcing,
                and visibility into how materials are evaluated and described.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Accessible, Responsible Education</h3>
              <p className="text-zinc-400">
                Scientific information should be accurate and structured without being reduced to marketing
                shorthand. We clarify limitations, uncertainty, and scope so education informs without persuading.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Regulatory Awareness</h3>
              <p className="text-zinc-400">
                We respect FDA and FTC guidance. We do not make therapeutic or disease-related claims, do not
                market products for human consumption, and clearly separate education from clinical services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Vision for the Future</h2>
            <p className="section-subtitle">
              A brand-centric platform built for responsible collaboration across medical, research, and
              healthcare-adjacent organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Telehealth and Clinical Access</h3>
              <p className="text-zinc-400">
                We intend to support telehealth pathways operated independently by licensed medical professionals.
                Clinical decisions occur solely within provider-patient relationships. The brand does not practice
                medicine and does not direct clinical outcomes.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Physician, Clinic, and Med Spa Integration</h3>
              <p className="text-zinc-400">
                We are building for physician groups, clinics, and medical spas seeking a credible, science-aligned
                brand partner with transparent standards, co-branding, and educational collaboration.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Brand Partnerships and Market Presence</h3>
              <p className="text-zinc-400">
                Our brand is designed for strategic brand deals and co-branded educational initiatives that strengthen
                credibility and long-term trust, not short-term reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="card-glass p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Commitment</h2>
            <p className="text-zinc-400">
              Science Based Body Peptides is committed to brand integrity over short-term reach,
              scientific discipline over hype, and partnerships that strengthen credibility instead of
              diluting it. Our goal is not ubiquity. It is relevance with authority.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-default">
          <div className="card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Explore Brand Partnerships</h2>
              <p className="text-zinc-400">
                If your organization values credibility, transparency, and science-first education,
                we would welcome a conversation.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/brand-partnerships" className="btn-primary btn-md">
                Partnership Details
              </Link>
              <Link href="/affiliate-program" className="btn-secondary btn-md">
                Affiliate Program
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Notice */}
      <section className="py-10 border-t border-border">
        <div className="container-default">
          <div className="card-glass p-6">
            <p className="text-xs text-zinc-500 text-center max-w-4xl mx-auto">
              Products are intended for research and educational purposes only. Information provided is not intended
              to diagnose, treat, cure, or prevent any disease. Medical services, where applicable, are provided
              independently by licensed professionals through separate clinical platforms.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
