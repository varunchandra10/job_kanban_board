import React from 'react';
import { User, Phone, MapPin, Globe, Github } from 'lucide-react';

export interface PersonalDemographicsSectionProps {
  fullName: string;
  setFullName: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  linkedin: string;
  setLinkedin: (v: string) => void;
  github: string;
  setGithub: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  markChanged: () => void;
}

export const PersonalDemographicsSection: React.FC<PersonalDemographicsSectionProps> = ({
  fullName,
  setFullName,
  age,
  setAge,
  phone,
  setPhone,
  location,
  setLocation,
  linkedin,
  setLinkedin,
  github,
  setGithub,
  bio,
  setBio,
  markChanged,
}) => {
  return (
    <section id="sec-demographics" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <User size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              1. Personal Demographics &amp; Contact
            </h2>
            <span className="text-[11px] text-slate-400">Your core candidate identity &amp; quick contact info</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Full Legal / Preferred Name
          </label>
          <input
            type="text"
            placeholder="e.g. Alex Zhang"
            value={fullName}
            onChange={e => { setFullName(e.target.value); markChanged(); }}
            className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Age or Date of Birth
          </label>
          <input
            type="text"
            placeholder="e.g. 24 or May 2002"
            value={age}
            onChange={e => { setAge(e.target.value); markChanged(); }}
            className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-3.5 sm:top-3 text-slate-400" />
            <input
              type="tel"
              placeholder="e.g. +1 (555) 019-2834"
              value={phone}
              onChange={e => { setPhone(e.target.value); markChanged(); }}
              className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Current Location &amp; Timezone
          </label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-3.5 sm:top-3 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. San Francisco, CA (PST)"
              value={location}
              onChange={e => { setLocation(e.target.value); markChanged(); }}
              className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            LinkedIn Profile URL
          </label>
          <div className="relative">
            <Globe size={14} className="absolute left-3.5 top-3.5 sm:top-3 text-slate-400" />
            <input
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={linkedin}
              onChange={e => { setLinkedin(e.target.value); markChanged(); }}
              className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            GitHub Profile URL
          </label>
          <div className="relative">
            <Github size={14} className="absolute left-3.5 top-3.5 sm:top-3 text-slate-400" />
            <input
              type="url"
              placeholder="https://github.com/..."
              value={github}
              onChange={e => { setGithub(e.target.value); markChanged(); }}
              className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bio / Summary with Counter */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Professional Bio &amp; Elevator Pitch
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {bio.length} characters
          </span>
        </div>
        <textarea
          rows={3}
          placeholder="e.g. Full Stack & AI Systems Engineer with 3+ years experience building distributed workflows. Passionate about real-time systems, clean API architectures, and algorithmic problem-solving."
          value={bio}
          onChange={e => { setBio(e.target.value); markChanged(); }}
          className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed transition-colors"
        />
      </div>
    </section>
  );
};
