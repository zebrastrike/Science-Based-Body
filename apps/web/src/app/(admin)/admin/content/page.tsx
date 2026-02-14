'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/api';
import { ToastStack, useToasts } from '@/components/admin/Toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function ContentPage() {
  const { toasts, push, dismiss } = useToasts();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [deleteFaq, setDeleteFaq] = useState<FAQ | null>(null);
  const [policies, setPolicies] = useState({
    terms: '',
    privacy: '',
    shipping: '',
    returns: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const faqData = await adminRequest<{ categories: string[]; faqs: Record<string, Array<{ id?: string; question: string; answer: string }>> }>('/support/faq');
      // Flatten grouped FAQ response into a flat array
      const flatFaqs: FAQ[] = [];
      if (faqData?.faqs && typeof faqData.faqs === 'object') {
        for (const [, items] of Object.entries(faqData.faqs)) {
          for (const item of items) {
            flatFaqs.push({
              id: item.id || `faq-${flatFaqs.length}`,
              question: item.question,
              answer: item.answer,
            });
          }
        }
      }
      setFaqs(flatFaqs);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqQuestion(faq.question);
      setFaqAnswer(faq.answer);
    } else {
      setEditingFaq(null);
      setFaqQuestion('');
      setFaqAnswer('');
    }
    setShowFaqModal(true);
  };

  const saveFaq = () => {
    if (editingFaq) {
      setFaqs((prev) =>
        prev.map((faq) => (faq.id === editingFaq.id ? { ...faq, question: faqQuestion, answer: faqAnswer } : faq)),
      );
      push('FAQ updated.');
    } else {
      setFaqs((prev) => [
        { id: `faq-${Date.now()}`, question: faqQuestion, answer: faqAnswer },
        ...prev,
      ]);
      push('FAQ created.');
    }
    setShowFaqModal(false);
  };

  const moveFaq = (index: number, direction: number) => {
    setFaqs((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      updated.splice(index + direction, 0, removed);
      return updated;
    });
  };

  const deleteFaqEntry = () => {
    if (!deleteFaq) return;
    setFaqs((prev) => prev.filter((faq) => faq.id !== deleteFaq.id));
    push('FAQ deleted.');
    setDeleteFaq(null);
  };

  const savePolicies = () => {
    push('Policies saved.');
  };

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div>
        <h1 className="text-2xl font-bold text-white">Content</h1>
        <p className="text-zinc-400 mt-1">Manage FAQs, blog posts, and policy pages.</p>
      </div>

      <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">FAQs</h2>
          <button
            onClick={() => openFaqModal()}
            className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg"
          >
            Add FAQ
          </button>
        </div>
        {isLoading ? (
          <p className="text-zinc-500">Loading FAQs...</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">{faq.question}</p>
                    <p className="text-sm text-zinc-500 mt-1">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveFaq(index, -1)}
                      disabled={index === 0}
                      className="px-2.5 py-1.5 text-xs text-zinc-400 border border-border rounded-lg disabled:opacity-50"
                    >
                      Up
                    </button>
                    <button
                      onClick={() => moveFaq(index, 1)}
                      disabled={index === faqs.length - 1}
                      className="px-2.5 py-1.5 text-xs text-zinc-400 border border-border rounded-lg disabled:opacity-50"
                    >
                      Down
                    </button>
                    <button
                      onClick={() => openFaqModal(faq)}
                      className="px-2.5 py-1.5 text-xs text-brand-primary border border-brand-primary/40 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteFaq(faq)}
                      className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/40 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {faqs.length === 0 && <p className="text-sm text-zinc-500">No FAQs yet.</p>}
          </div>
        )}
      </div>

      <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Blog Posts</h2>
          <button
            onClick={() => push('Blog post editor coming soon.', 'info')}
            className="px-4 py-2 text-sm text-zinc-300 border border-border rounded-lg"
          >
            Create Post
          </button>
        </div>
        <p className="text-sm text-zinc-500">No blog posts available. Add a new post to start publishing updates.</p>
      </div>

      <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Policy Pages</h2>
          <button
            onClick={savePolicies}
            className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg"
          >
            Save Policies
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(['terms', 'privacy', 'shipping', 'returns'] as const).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-zinc-400 mb-2 capitalize">{key}</label>
              <textarea
                value={policies[key]}
                onChange={(e) => setPolicies({ ...policies, [key]: e.target.value })}
                rows={6}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                placeholder={`Edit ${key} policy content...`}
              ></textarea>
            </div>
          ))}
        </div>
      </div>

      {showFaqModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-lg">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">{editingFaq ? 'Edit FAQ' : 'Create FAQ'}</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Question</label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Answer</label>
                <textarea
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                ></textarea>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowFaqModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveFaq}
                className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg"
              >
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteFaq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-md">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Delete FAQ</h2>
            </div>
            <div className="p-4 text-zinc-300">
              Delete <span className="text-white font-semibold">{deleteFaq.question}</span>?
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setDeleteFaq(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={deleteFaqEntry}
                className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
