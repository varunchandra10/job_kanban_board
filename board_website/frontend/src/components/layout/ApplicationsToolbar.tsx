import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApplicationCategory } from '../../types';
import { COUNTRIES } from '../../utils/constants';
import { LayoutGrid, Building2, Landmark, Beaker, Calendar, Plus, Globe, ChevronDown } from 'lucide-react';

export const ApplicationsToolbar: React.FC = () => {
  const {
    applications,
    activeAppCategory,
    setActiveAppCategory,
    activeCountry,
    setActiveCountry,
    openAddAppModal,
    openQuickList,
  } = useApp();

  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (countryMenuRef.current && !countryMenuRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute counts
  const countAll = applications.length;
  const countIndustry = applications.filter(a => (a.category || 'Industry') === 'Industry').length;
  const countGov = applications.filter(a => a.category === 'Government').length;
  const countRes = applications.filter(a => a.category === 'Research').length;

  const categories: Array<{ id: ApplicationCategory; label: string; count?: number; icon: React.ReactNode }> = [
    { id: 'All', label: 'All', count: countAll, icon: <LayoutGrid size={14} /> },
    { id: 'Industry', label: 'Industry', count: countIndustry, icon: <Building2 size={14} /> },
    { id: 'Government', label: 'Government', count: countGov, icon: <Landmark size={14} /> },
    { id: 'Research', label: 'Research', count: countRes, icon: <Beaker size={14} /> },
    { id: 'Calendar', label: 'Calendar', icon: <Calendar size={14} /> },
  ];

  const selectedCountryObj = COUNTRIES.find(c => c.code === activeCountry);

  return (
    <nav className="flex items-center justify-between px-2.5 sm:px-6 py-1.5 sm:py-2 bg-white/95 dark:bg-[#121214]/95 border-b border-slate-200 dark:border-white/10 backdrop-blur-md transition-colors relative">
      {/* Left: Scrollable Category Filter Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto min-w-0 flex-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-2">
        {categories.map(cat => {
          const isActive = activeAppCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveAppCategory(cat.id)}
              title={cat.label}
              aria-label={cat.label}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all border shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm font-bold'
                  : 'bg-white dark:bg-[#18181b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Fixed Action Buttons (Country Filter & +Add Button) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1.5 sm:pl-2 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md z-10 border-l border-slate-200/60 dark:border-white/10 sm:border-l-0 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.35)] sm:shadow-none">
        {/* Country Filter Dropdown */}
        <div className="relative" ref={countryMenuRef}>
          <button
            type="button"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#18181b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap transition-all"
            onClick={() => setIsCountryOpen(!isCountryOpen)}
            aria-haspopup="true"
            aria-expanded={isCountryOpen}
            title={selectedCountryObj ? selectedCountryObj.name : 'Filter by country'}
          >
            <Globe size={13} className="text-slate-400 shrink-0" />
            <span className="hidden sm:inline">{selectedCountryObj ? selectedCountryObj.name : 'All countries'}</span>
            <span className="sm:hidden font-medium">{selectedCountryObj ? selectedCountryObj.code : 'All'}</span>
            <ChevronDown size={12} className="opacity-70 shrink-0" />
          </button>

          {isCountryOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 max-h-72 overflow-y-auto bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1 text-slate-900 dark:text-slate-100">
              <button
                type="button"
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer ${
                  !activeCountry ? 'text-blue-600 dark:text-indigo-400 font-bold bg-blue-50 dark:bg-indigo-500/10' : ''
                }`}
                onClick={() => {
                  setActiveCountry('');
                  setIsCountryOpen(false);
                }}
              >
                <span>All countries</span>
                {!activeCountry && <span className="text-[10px]">&#10003;</span>}
              </button>
              <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
              {COUNTRIES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer ${
                    activeCountry === c.code ? 'text-blue-600 dark:text-indigo-400 font-bold bg-blue-50 dark:bg-indigo-500/10' : ''
                  }`}
                  onClick={() => {
                    setActiveCountry(c.code);
                    setIsCountryOpen(false);
                  }}
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                    {c.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Job Application Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
          onClick={() => openAddAppModal()}
          title="Add Application"
          aria-label="Add Application"
        >
          <Plus size={15} strokeWidth={2.5} className="shrink-0" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </nav>
  );
};
