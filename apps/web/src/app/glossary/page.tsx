'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Placeholder glossary data - will be replaced with uploaded content
// This structure supports the interactive dictionary format
interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
  relatedTerms?: string[];
  references?: string[];
}

// Placeholder categories for the glossary
const categories = [
  { id: 'peptide-basics', name: 'Peptide Basics', icon: '🧬' },
  { id: 'mechanisms', name: 'Mechanisms of Action', icon: '⚙️' },
  { id: 'research-methods', name: 'Research Methods', icon: '🔬' },
  { id: 'terminology', name: 'Scientific Terminology', icon: '📖' },
  { id: 'lab-procedures', name: 'Lab Procedures', icon: '🧪' },
];

// Placeholder entries - to be replaced with actual data
const placeholderEntries: GlossaryEntry[] = [
  {
    term: 'Peptide',
    definition: 'A short chain of amino acids linked by peptide bonds. Peptides are typically shorter than proteins, generally containing fewer than 50 amino acids. They play crucial roles in biological processes and are widely used in research.',
    category: 'peptide-basics',
    relatedTerms: ['Amino Acid', 'Protein', 'Peptide Bond'],
  },
  {
    term: 'Amino Acid',
    definition: 'Organic molecules that serve as the building blocks of peptides and proteins. There are 20 standard amino acids, each with a unique side chain that determines its properties.',
    category: 'peptide-basics',
    relatedTerms: ['Peptide', 'Protein'],
  },
  {
    term: 'Lyophilization',
    definition: 'A freeze-drying process used to preserve peptides by removing water content. This process maintains peptide stability and extends shelf life while preserving biological activity.',
    category: 'lab-procedures',
    relatedTerms: ['Reconstitution', 'Storage'],
  },
  {
    term: 'HPLC',
    definition: 'High-Performance Liquid Chromatography. An analytical technique used to separate, identify, and quantify components in a mixture. In peptide research, HPLC is the gold standard for purity verification.',
    category: 'research-methods',
    relatedTerms: ['Purity', 'Mass Spectrometry'],
  },
  {
    term: 'Reconstitution',
    definition: 'The process of dissolving a lyophilized (freeze-dried) peptide in a suitable solvent, typically bacteriostatic water or sterile water, to prepare it for research use.',
    category: 'lab-procedures',
    relatedTerms: ['Lyophilization', 'Bacteriostatic Water'],
  },
  {
    term: 'Half-Life',
    definition: 'The time required for the concentration of a substance to decrease by half. In peptide research, half-life is an important parameter for understanding compound stability and duration of activity.',
    category: 'terminology',
    relatedTerms: ['Bioavailability', 'Metabolism'],
  },
  {
    term: 'Receptor Agonist',
    definition: 'A molecule that binds to a receptor and activates it to produce a biological response. Many research peptides function as receptor agonists, mimicking the action of natural hormones or signaling molecules.',
    category: 'mechanisms',
    relatedTerms: ['Receptor Antagonist', 'Binding Affinity'],
  },
  {
    term: 'Certificate of Analysis (COA)',
    definition: 'A document provided by a testing laboratory that confirms the identity, purity, and quality of a compound. COAs typically include HPLC chromatograms, mass spectrometry data, and purity percentages.',
    category: 'research-methods',
    relatedTerms: ['HPLC', 'Purity', 'Third-Party Testing'],
  },
];

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  // Filter entries based on search and category
  const filteredEntries = useMemo(() => {
    return placeholderEntries.filter((entry) => {
      const matchesSearch = searchQuery === '' ||
        entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.definition.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || entry.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Group entries by first letter for alphabetical navigation
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: GlossaryEntry[] } = {};
    filteredEntries.forEach((entry) => {
      const letter = entry.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
              Peptide Research Glossary
            </h1>
            <p className="text-xl text-zinc-400">
              An educational reference for peptide research terminology.
              Explore definitions, mechanisms, and scientific concepts used in the field.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-background-primary border-b border-border sticky top-0 z-10">
        <div className="container-default">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-brand-primary text-black'
                    : 'bg-background-secondary text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-brand-primary text-black'
                      : 'bg-background-secondary text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Alphabetical Navigation */}
          <div className="flex flex-wrap gap-1 mt-4">
            {alphabet.map((letter) => {
              const hasEntries = groupedEntries[letter]?.length > 0;
              return (
                <button
                  key={letter}
                  onClick={() => {
                    if (hasEntries) {
                      document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  disabled={!hasEntries}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    hasEntries
                      ? 'bg-background-secondary text-white hover:bg-brand-primary hover:text-black'
                      : 'bg-background-tertiary text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Glossary Entries */}
      <section className="py-12">
        <div className="container-default">
          {Object.keys(groupedEntries).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-lg">No terms found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.keys(groupedEntries).sort().map((letter) => (
                <div key={letter} id={`letter-${letter}`}>
                  <h2 className="text-3xl font-bold text-brand-primary mb-6 border-b border-border pb-2">
                    {letter}
                  </h2>
                  <div className="space-y-4">
                    {groupedEntries[letter].map((entry) => (
                      <div
                        key={entry.term}
                        className="card p-6 hover:border-brand-primary/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedTerm(expandedTerm === entry.term ? null : entry.term)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {entry.term}
                            </h3>
                            <p className={`text-zinc-400 ${expandedTerm === entry.term ? '' : 'line-clamp-2'}`}>
                              {entry.definition}
                            </p>
                          </div>
                          <span className="text-zinc-500 ml-4">
                            {expandedTerm === entry.term ? '−' : '+'}
                          </span>
                        </div>

                        {expandedTerm === entry.term && entry.relatedTerms && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-zinc-500 mb-2">Related Terms:</p>
                            <div className="flex flex-wrap gap-2">
                              {entry.relatedTerms.map((term) => (
                                <span
                                  key={term}
                                  className="px-3 py-1 bg-background-secondary rounded-full text-sm text-zinc-300"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Info Banner */}
      <section className="py-12 bg-background-secondary">
        <div className="container-default">
          <div className="card-glass p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Educational Resource
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              This glossary is provided for educational purposes to help researchers understand common terminology in peptide science.
              All information is for research reference only.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
