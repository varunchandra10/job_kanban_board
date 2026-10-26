import React, { useState, useEffect } from 'react';

interface LogoData {
  p: string;
  h: string;
}

let cachedLogos: Record<string, LogoData> | null = null;

export const CompanyLogo: React.FC<{ company: string; size?: number }> = ({ company, size = 32 }) => {
  const [logos, setLogos] = useState<Record<string, LogoData> | null>(cachedLogos);

  useEffect(() => {
    if (!cachedLogos) {
      fetch('/logos.json')
        .then(res => res.json())
        .then(data => {
          cachedLogos = data;
          setLogos(data);
        })
        .catch(() => {});
    }
  }, []);

  const s = String(company || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s === 'google') {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/>
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/>
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/>
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/>
        </svg>
      </div>
    );
  }

  if (s === 'microsoft') {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10.5v10.5H1z"/>
          <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/>
          <path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/>
          <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/>
        </svg>
      </div>
    );
  }

  if (logos && logos[s]) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill={`#${logos[s].h}`} d={logos[s].p} />
        </svg>
      </div>
    );
  }

  // Fallback avatar letter
  const initial = (company || '?')[0].toUpperCase();
  const colors = [
    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  ];
  const colorClass = colors[company ? company.charCodeAt(0) % colors.length : 0];

  return (
    <div
      className={`flex items-center justify-center font-bold text-xs rounded-lg border shadow-xs shrink-0 ${colorClass}`}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
};
