import Link from 'next/link';

export default function BrandPartnershipsPage() {
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
              Brand Partnerships and Strategic Collaborations
            </h1>
            <p className="text-xl text-zinc-400">
              A premium, science-first brand partner for clinics, physician groups, MSOs, and
              healthcare-adjacent organizations seeking credibility and long-term trust.
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="section">
        <div className="container-default">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Brand-First Positioning With Market Relevance
              </h2>
              <p className="text-zinc-400">
                Science Based Body Peptides is structured as a brand partner, not a commodity supplier.
                Our market position is built on evidence-aligned education, clear sourcing standards,
                and compliance-aware communication that supports long-term credibility.
              </p>
              <p className="text-zinc-400">
                We collaborate with organizations that value discipline, transparency, and professional
                brand presentation. Our role is to strengthen trust, not to chase short-term volume.
              </p>
            </div>
            <div className="card-glass p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Medical Services Clarity</h3>
              <p className="text-zinc-400">
                Medical services, where applicable, are provided only by licensed professionals through
                separate clinical platforms. We do not practice medicine and do not direct clinical outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Partner With */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Who We Partner With</h2>
            <p className="section-subtitle">
              Organizations that prioritize scientific rigor, brand integrity, and patient-safe communication.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Physician Groups</h3>
              <p className="text-zinc-400">
                Practices seeking a credible brand partner aligned with evidence-based education and
                responsible visibility.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Medical Spas and Clinics</h3>
              <p className="text-zinc-400">
                Teams looking for co-branding and education-forward collaboration without consumer
                wellness claims.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">MSOs and Healthcare Networks</h3>
              <p className="text-zinc-400">
                Groups focused on scalable, compliant partnerships with a defensible brand posture.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Research Organizations</h3>
              <p className="text-zinc-400">
                Institutions and labs that value traceability, education, and transparent sourcing standards.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Healthcare-Adjacent Brands</h3>
              <p className="text-zinc-400">
                Brands seeking a science-first partner for responsible education and brand-aligned visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Partnership Looks Like */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">What Partnership Looks Like</h2>
            <p className="section-subtitle">
              Collaboration focused on credibility, clear standards, and long-term trust.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Co-Branded Education</h3>
              <p className="text-zinc-400">
                Joint educational content grounded in publicly available research, with explicit limits and
                compliance-aware language.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Brand Visibility</h3>
              <p className="text-zinc-400">
                Responsible exposure through events, publications, and shared resources that elevate
                credibility without promotional hype.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Transparent Standards</h3>
              <p className="text-zinc-400">
                Clear sourcing and quality documentation, including third-party testing references where
                available and appropriate.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Long-Term Alignment</h3>
              <p className="text-zinc-400">
                Partnerships designed for stability and trust, not short-term campaigns or performance claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Not Do */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="card p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              What We Do Not Do
            </h2>
            <ul className="space-y-3 text-zinc-400">
              <li>No therapeutic, disease-related, or outcome-based claims.</li>
              <li>No private-label shortcuts that compromise traceability or brand integrity.</li>
              <li>No marketing that implies products are for human consumption.</li>
              <li>No partnerships that prioritize volume over credibility.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Brand Standards and Compliance Expectations</h2>
            <p className="section-subtitle">
              We align with partners who value responsible communication and regulatory awareness.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Evidence-Aligned Language</h3>
              <p className="text-zinc-400">
                Clear separation between established research and emerging investigation, with no
                consumer outcome claims.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Transparent Documentation</h3>
              <p className="text-zinc-400">
                Sourcing and quality documentation are central to brand credibility and partner trust.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Professional Presentation</h3>
              <p className="text-zinc-400">
                Brand materials and messaging must align with a science-first, compliance-aware posture.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Clinical Separation</h3>
              <p className="text-zinc-400">
                Medical services are provided solely by licensed professionals through separate clinical
                platforms. We do not practice medicine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="card-glass p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Start a Partnership Conversation</h2>
              <p className="text-zinc-400">
                Tell us about your organization and the collaboration you have in mind. We review every
                request for alignment with brand standards and compliance expectations.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/contact" className="btn-primary btn-md">
                Contact Partnerships
              </Link>
              <Link href="/branded-for-science" className="btn-secondary btn-md">
                Brand Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Notice */}
      <section className="py-10 border-t border-border">
        <div className="container-default">
          <p className="text-xs text-zinc-500 text-center max-w-4xl mx-auto">
            Products are intended for research and educational purposes only. Information provided is not intended
            to diagnose, treat, cure, or prevent any disease. Medical services, where applicable, are provided
            independently by licensed professionals through separate clinical platforms.
          </p>
        </div>
      </section>
    </main>
  );
}
