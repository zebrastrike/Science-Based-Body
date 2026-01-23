import Link from 'next/link';

export default function AffiliateProgramPage() {
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
              Affiliate and Partner Program
            </h1>
            <p className="text-xl text-zinc-400">
              A compliance-aware program for educators and professional partners who align with a
              science-first brand and responsible communication.
            </p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container-default">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Program Overview
              </h2>
              <p className="text-zinc-400">
                The Science Based Body Peptides Affiliate and Partner Program is designed for brand-aligned
                advocates and educators. We prioritize transparency, ethical promotion, and responsible
                education in every collaboration.
              </p>
              <p className="text-zinc-400">
                This program is not a referral system for medical decisions or treatment outcomes. It supports
                brand awareness and educational visibility, with clear separation from clinical services.
              </p>
            </div>
            <div className="card-glass p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Professional and Platform-Safe</h3>
              <p className="text-zinc-400">
                We maintain compliance-aware messaging aligned with FDA and FTC guidance and common platform
                requirements. Participation requires transparent disclosure and accurate, non-promissory language.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who the Program Is For */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Who the Program Is For</h2>
            <p className="section-subtitle">
              Partners who can communicate responsibly and align with a science-first brand posture.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Educators and Researchers</h3>
              <p className="text-zinc-400">
                Individuals and institutions producing clear, evidence-aligned educational content.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Clinics and Professional Teams</h3>
              <p className="text-zinc-400">
                Groups seeking brand-aligned visibility while maintaining separation from clinical services.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Healthcare-Adjacent Creators</h3>
              <p className="text-zinc-400">
                Professionals who prioritize accuracy, compliance, and transparency over promotional hype.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Affiliates Can Share */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">What Affiliates Can Share</h2>
            <p className="section-subtitle">
              Brand education and research context, not medical advice or treatment guidance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Brand and Quality Standards</h3>
              <p className="text-zinc-400">
                Our sourcing approach, documentation standards, and commitment to evidence-aligned education.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Research Summaries</h3>
              <p className="text-zinc-400">
                Publicly available scientific literature summaries with clear limitations and context.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Educational Resources</h3>
              <p className="text-zinc-400">
                Structured content designed to inform, not persuade, and never to imply clinical outcomes.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Compliance-Safe Messaging</h3>
              <p className="text-zinc-400">
                Language that avoids therapeutic claims, disease references, or outcome-based statements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Compliance and Disclosure Expectations</h2>
            <p className="section-subtitle">
              Transparency and responsibility are required for participation.
            </p>
          </div>
          <div className="card p-8">
            <ul className="space-y-3 text-zinc-400">
              <li>Clear disclosure of affiliate relationships in all promotional placements.</li>
              <li>No medical, therapeutic, or disease-related claims.</li>
              <li>No implication of clinical advice or patient outcomes.</li>
              <li>Content must be evidence-aligned, factual, and non-promissory.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Compensation */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Compensation Structure</h2>
            <p className="section-subtitle">
              High-level, non-promissory guidance on how partners are recognized.
            </p>
          </div>
          <div className="card p-6">
            <p className="text-zinc-400">
              Compensation is structured as a transparent, performance-neutral recognition model based on
              brand-aligned referrals and educational visibility. Specific terms are provided after application
              review and alignment assessment.
            </p>
          </div>
        </div>
      </section>

      {/* Application */}
      <section className="section bg-background-secondary/40">
        <div className="container-default">
          <div className="card-glass p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Application and Review Process</h2>
              <p className="text-zinc-400">
                We review every application for brand alignment, compliance awareness, and educational fit.
                Approved partners receive clear guidelines and messaging standards.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/contact" className="btn-primary btn-md">
                Apply for the Program
              </Link>
              <Link href="/brand-partnerships" className="btn-secondary btn-md">
                Brand Partnerships
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
