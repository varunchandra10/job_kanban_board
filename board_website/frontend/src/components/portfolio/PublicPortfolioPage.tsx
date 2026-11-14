import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_BASE } from '../../services/api';
import { PublicPortfolioResponse } from '../../types';
import { DSA_CATEGORIES } from '../../data/dsaTopics';
import {
  Flame,
  Download,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Award,
  Code2,
  BookOpen,
  Clock,
  Calendar,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  CheckCheck,
  Share2,
  Layers,
  GraduationCap,
  Briefcase,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';

export const PublicPortfolioPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicPortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError('No portfolio username specified in URL');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api.getPublicPortfolio(slug)
      .then(res => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Portfolio not found or set to private');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Loading State with sleek glassmorphic skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <Sparkles size={28} className="text-indigo-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Loading Verified Portfolio...</h2>
          <p className="text-xs text-slate-400">
            Verifying candidate daily streaks, LeetCode roadmap mastery, and credentials.
          </p>
          <div className="w-48 h-1.5 mx-auto bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Private Profile State
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Lock size={28} className="text-rose-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">Portfolio Private or Not Found</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              The portfolio for <code className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-mono text-xs">/u/{slug}</code> is either currently set to private by the developer or has not been claimed yet.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to Job Tracker</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats, dsa, recentLearnings, resume } = data;

  // Extract candidate initials
  const initials = (user.name || 'Developer')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(s => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DEV';

  // Calculate Category Progress
  const solvedSet = new Set(dsa.solvedProblemIds.map(p => p.id));
  const masteredSet = new Set(dsa.solvedProblemIds.filter(p => p.repetition_stage >= 4).map(p => p.id));

  const categoryStats = DSA_CATEGORIES.map(cat => {
    const total = cat.problems.length;
    const solved = cat.problems.filter(p => solvedSet.has(p.id)).length;
    const mastered = cat.problems.filter(p => masteredSet.has(p.id)).length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    return {
      id: cat.id,
      name: cat.name,
      total,
      solved,
      mastered,
      pct,
    };
  });

  const totalCatalogProblems = 79;
  const overallMasteryPct = Math.round((dsa.solvedProblemIds.length / totalCatalogProblems) * 100);

  // Parse skill tags
  const skillTags = user.skills
    ? user.skills.split(/[,\n•|]+/).map(s => s.trim()).filter(Boolean)
    : [];

  const resumeDownloadUrl = resume?.downloadUrl
    ? `${API_BASE.replace('/api', '')}${resume.downloadUrl}`
    : `/api/portfolio/${data.slug}/resume`;

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white pb-20">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -mt-40" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[600px] h-[400px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation & Recruiter Verification Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#09090b]/80 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-sm shadow-md shadow-indigo-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                Verified Proof-of-Work
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Job Tracker Showcase</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCheck size={13} className="text-emerald-400" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  <span>Share Profile</span>
                </>
              )}
            </button>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all"
            >
              <span>Build Yours</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8 relative z-10">
        
        {/* 1. Recruiter Hero Candidate Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div className="flex items-start sm:items-center gap-5">
              {/* Avatar */}
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl object-cover ring-4 ring-indigo-500/30 border border-white/10 shadow-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black ring-4 ring-indigo-500/30 shadow-xl">
                  {initials}
                </div>
              )}

              {/* Identity & Headline */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck size={12} />
                    VERIFIED DISCIPLINE
                  </span>
                </div>

                {user.headline ? (
                  <p className="text-sm sm:text-base font-semibold text-indigo-300 m-0">
                    {user.headline}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400 m-0">
                    Software Engineer &amp; Daily Problem Solver
                  </p>
                )}

                {/* Education / University Tag */}
                {(user.school || user.degree) && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <GraduationCap size={14} className="text-indigo-400 shrink-0" />
                    <span>
                      {user.degree ? `${user.degree}` : ''}
                      {user.degree && user.school ? ' • ' : ''}
                      {user.school ? `${user.school}` : ''}
                      {user.grad_date ? ` (${user.grad_date})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct High-Conversion Call To Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
              {resume && resume.hasPdf ? (
                <a
                  href={resumeDownloadUrl}
                  download={resume.name || 'resume.pdf'}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
                >
                  <Download size={16} strokeWidth={2.5} />
                  <span>Download Verified Resume</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCopyEmail(user.email || '')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <Mail size={16} />
                  <span>Request Resume</span>
                </button>
              )}

              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all"
                >
                  <Mail size={16} />
                  <span>Contact</span>
                </a>
              )}
            </div>
          </div>

          {/* Bio & Social Links */}
          <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 max-w-2xl">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
                {user.bio || 'Consistently building scalable software, mastering core data structures & algorithms, and tracking daily engineering growth.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {user.github && (
                <a
                  href={user.github.startsWith('http') ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </a>
              )}

              {user.linkedin && (
                <a
                  href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current text-[#0a66c2]" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              )}

              {user.email && (
                <button
                  type="button"
                  onClick={() => handleCopyEmail(user.email || '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                  title="Copy candidate email"
                >
                  {copiedEmail ? (
                    <>
                      <CheckCheck size={13} className="text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Email</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2. Verified Active Discipline & Momentum Showcase */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] via-white/[0.02] to-white/[0.01] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-extrabold shadow-lg shadow-orange-500/30">
                <Flame size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Candidate Reliability Index
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Tier {stats.level} • {stats.levelTitle}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white m-0 mt-0.5">
                  Verified Daily Discipline Streak
                </h2>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Candidate systematically solves algorithms and writes code without breaking consistency.
                </p>
              </div>
            </div>

            {/* 4 Consistency Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center min-w-[100px]">
                <div className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
                  {stats.streak}d
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">
                  Active Streak
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center min-w-[100px]">
                <div className="text-xl sm:text-2xl font-black text-orange-400 tabular-nums">
                  {stats.longestStreak}d
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">
                  Longest Streak
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center min-w-[100px]">
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                  {stats.masteredDsaCount}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">
                  1-4-7 Mastered
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center min-w-[100px]">
                <div className="text-xl sm:text-2xl font-black text-purple-400 tabular-nums">
                  {stats.totalXP}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">
                  Discipline XP
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Consistency Punchcard */}
          <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" />
              <span className="text-xs font-bold text-slate-300">Active Week Punchcard:</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const isDayActive = stats.weekPunchcard && stats.weekPunchcard[idx];
                return (
                  <div
                    key={day}
                    className="flex flex-col items-center gap-1.5"
                    title={`${day}: ${isDayActive ? 'Active Engineering Logged' : 'Rest'}`}
                  >
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center font-bold text-[10px] transition-all ${
                        isDayActive
                          ? 'bg-gradient-to-tr from-amber-500 to-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-white/5 border border-white/10 text-slate-500'
                      }`}
                    >
                      {isDayActive ? <Check size={12} strokeWidth={3} /> : '·'}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{day}</span>
                  </div>
                );
              })}
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={12} />
                High Hiring Signal
              </span>
            </div>
          </div>
        </section>

        {/* 3. Interactive DSA Algorithmic Mastery Meters (12 Core Patterns) */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
                <Code2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white m-0">
                    DSA Problem Solving &amp; Algorithm Mastery
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    79 Curated Challenges
                  </span>
                </div>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Curated coding interview roadmap tracked with the 1-4-7 Spaced Repetition retention system.
                </p>
              </div>
            </div>

            {/* Overall Mastery Pill */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Solved
                </div>
                <div className="text-lg font-black text-white tabular-nums">
                  {dsa.solvedProblemIds.length} <span className="text-xs text-slate-500 font-normal">/ {totalCatalogProblems}</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 text-sm">
                {overallMasteryPct}%
              </div>
            </div>
          </div>

          {/* 12 Algorithmic Category Progress Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map(cat => {
              const isMastered = cat.solved === cat.total && cat.total > 0;
              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                      {cat.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 tabular-nums">
                      {cat.solved}/{cat.total}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                          : cat.pct > 50
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          : cat.pct > 0
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                    <span>{cat.pct}% Completed</span>
                    {cat.mastered > 0 && (
                      <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5">
                        <Check size={10} /> {cat.mastered} Mastered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Technical Skills & Work Experience (if provided) */}
        {(skillTags.length > 0 || user.experience || user.projects) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills & Technologies */}
            {skillTags.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
                  <Layers size={18} className="text-indigo-400" />
                  <h3 className="text-base font-bold text-white m-0">Core Technical Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillTags.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Experience / Projects Highlights */}
            {(user.projects || user.experience) && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
                  <Briefcase size={18} className="text-purple-400" />
                  <h3 className="text-base font-bold text-white m-0">Experience &amp; Projects</h3>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-1">
                  {user.experience && (
                    <div className="whitespace-pre-line border-l-2 border-indigo-500/40 pl-3">
                      {user.experience}
                    </div>
                  )}
                  {user.projects && (
                    <div className="whitespace-pre-line border-l-2 border-purple-500/40 pl-3 pt-2">
                      {user.projects}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 5. Recent Technical Focus & Learning Logs */}
        {recentLearnings && recentLearnings.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold text-white m-0">
                  Recent Technical Study &amp; Problem Solving Logs
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {stats.learningCount} Verified Entries
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentLearnings.map(item => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">{item.date}</span>
                    {item.duration_minutes > 0 && (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-300">
                        <Clock size={11} /> {item.duration_minutes}m
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-200 line-clamp-1">
                    {item.title || item.topic || 'Engineering Deep-Dive'}
                  </div>
                  {item.tags && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.split(',').map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md"
                        >
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Recruiter Trust & Verification Footer */}
        <footer className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Cryptographically Verified Proof-of-Work by Job Tracker Kanban</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed m-0">
            This portfolio presents verified proof of engineering discipline, coding interview progress, and technical qualifications. Candidate confidential job pipelines and target companies remain protected.
          </p>
          <div className="pt-2 text-[11px] text-slate-400 font-mono">
            Candidate ID: <span className="text-indigo-400">{data.slug}</span>
          </div>
        </footer>

      </main>
    </div>
  );
};
