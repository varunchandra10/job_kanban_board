import React, { useState } from 'react';
import { ExternalLink, Plus, Sparkles, Trash2, CheckCheck, X } from 'lucide-react';
import { sanitizeUrl } from '../../../utils/security';
import { useApp } from '../../../context/AppContext';

export const QuickLinksSection: React.FC = () => {
  const { quickLinks, addQuickLink, removeQuickLink, showToast } = useApp();

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
    showToast('Copied link to clipboard');
  };

  const openAddLinkModal = () => {
    setEditingLinkId(null);
    setLinkTitle('');
    setLinkUrl('');
    setIsLinkModalOpen(true);
  };

  const openEditLinkModal = (link: { id: string; title: string; url: string }) => {
    setEditingLinkId(link.id);
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    if (editingLinkId) {
      removeQuickLink(editingLinkId);
      addQuickLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: 'custom',
      });
      showToast('Link updated');
    } else {
      addQuickLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: 'custom',
      });
      showToast('Quick link added');
    }
    setIsLinkModalOpen(false);
  };

  return (
    <section id="sec-quicklinks" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ExternalLink size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              2. Quick Links &amp; Shortcut Profiles
            </h2>
            <span className="text-[11px] text-slate-400">
              1-click shortcuts to your portfolio, LeetCode profile, GitHub, or live docs
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddLinkModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Plus size={14} />
          <span>Add Link</span>
        </button>
      </div>

      {quickLinks.length === 0 ? (
        <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
          No quick links added yet. Click &quot;Add Link&quot; to save shortcuts.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map(link => {
            const isEmail = link.url.includes('@') && !link.url.startsWith('http');
            const href = isEmail ? `mailto:${link.url.replace(/^mailto:/i, '')}` : link.url;

            return (
              <div
                key={link.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] transition-all gap-2.5 group"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {link.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {link.url}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <a
                    href={sanitizeUrl(href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    {isEmail ? 'Send ↗' : 'Open ↗'}
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(link.url, link.id)}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedLink === link.id ? (
                      <CheckCheck size={12} className="text-emerald-500" />
                    ) : (
                      'Copy'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditLinkModal(link)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <Sparkles size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeQuickLink(link.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Link Add/Edit Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingLinkId ? 'Edit Quick Link' : 'Add Quick Link'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Title or Platform Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. GitHub, LeetCode, Personal Site"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  required
                  className="w-full h-11 sm:h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] text-base sm:text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  URL or Email Address
                </label>
                <input
                  type="text"
                  placeholder="https://... or username@domain.com"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  required
                  className="w-full h-11 sm:h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] text-base sm:text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

