import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SkeletonProfilePage } from '../common/SkeletonLoader';
import {
  BarChart2,
  User,
  Settings,
  LucideIcon,
  Sprout,
  Zap,
  GraduationCap,
  Code2,
  Gem,
  Crown,
  Trophy,
} from 'lucide-react';
import { ProfileOverviewTab } from './tabs/ProfileOverviewTab';
import { ProfileCareerDataTab } from './tabs/ProfileCareerDataTab';
import { ProfileSettingsTab } from './tabs/ProfileSettingsTab';

export const TROPHY_TIER_CONFIG: Record<
  number,
  {
    icon: LucideIcon;
    gradient: string;
    border: string;
    text: string;
    bg: string;
    glow: string;
    title: string;
    min: number;
    max: number;
    description: string;
  }
> = {
  1: {
    icon: Sprout,
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-emerald-500/20',
    title: 'Novice Scout',
    min: 0,
    max: 200,
    description: 'First steps into the job market. Laying daily foundation habits.'
  },
  2: {
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-600',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    glow: 'shadow-blue-500/20',
    title: 'Apprentice',
    min: 200,
    max: 600,
    description: 'Building momentum. Consistent daily job outreach and problem solving.'
  },
  3: {
    icon: GraduationCap,
    gradient: 'from-indigo-500 to-violet-600',
    border: 'border-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    glow: 'shadow-indigo-500/20',
    title: 'Scholar',
    min: 600,
    max: 1200,
    description: 'Mastering core DSA algorithms and role-specific technical concepts.'
  },
  4: {
    icon: Code2,
    gradient: 'from-fuchsia-500 to-purple-600',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    glow: 'shadow-fuchsia-500/20',
    title: 'Practitioner',
    min: 1200,
    max: 2000,
    description: 'Interview velocity. Converting job leads and tackling tough coding rounds.'
  },
  5: {
    icon: Gem,
    gradient: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    glow: 'shadow-amber-500/20',
    title: 'Expert',
    min: 2000,
    max: 3200,
    description: 'High-yield precision. Seasoned problem-solving speed & polished brand.'
  },
  6: {
    icon: Crown,
    gradient: 'from-rose-500 to-pink-600',
    border: 'border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    glow: 'shadow-rose-500/20',
    title: 'Master',
    min: 3200,
    max: 5000,
    description: 'Elite dedication. System design command and multiple offer candidate.'
  },
  7: {
    icon: Trophy,
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    border: 'border-amber-400/50',
    text: 'text-amber-500 dark:text-amber-300',
    bg: 'bg-amber-500/15',
    glow: 'shadow-amber-500/30',
    title: 'Grandmaster',
    min: 5000,
    max: 999999,
    description: 'Pinnacle candidate. Legendary discipline and industry-leading performance.'
  }
};

export const Tier3DIcon: React.FC<{ tier: number; size?: number; className?: string }> = ({
  tier,
  size = 46,
  className = '',
}) => {
  switch (tier) {
    case 1:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <defs>
            <radialGradient id="sprout_floor_1" cx="50%" cy="85%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sprout_stem_1" x1="32" y1="56" x2="32" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="sprout_leaf_l_1" x1="12" y1="40" x2="32" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="85%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
            <linearGradient id="sprout_leaf_r_1" x1="52" y1="40" x2="32" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="35%" stopColor="#059669" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#a7f3d0" />
            </linearGradient>
            <linearGradient id="sprout_sheen_1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="sprout_shadow_1" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#064e3b" floodOpacity="0.35" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.2" />
            </filter>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="5" fill="url(#sprout_floor_1)" />
          <g filter="url(#sprout_shadow_1)">
            <path d="M30 56C30 56 30 42 32 34C34 26 35 20 35 20" stroke="url(#sprout_stem_1)" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M32 34C24 34 14 28 14 18C14 12 20 12 26 18C30 22 32 30 32 34Z" fill="url(#sprout_leaf_l_1)" />
            <path d="M30 30C26 27 18 23 16 17C18 14 24 16 28 22C30 25 30 30 30 30Z" fill="url(#sprout_sheen_1)" opacity="0.6" />
            <path d="M32 30C40 30 50 24 50 14C50 8 44 8 38 14C34 18 32 26 32 30Z" fill="url(#sprout_leaf_r_1)" />
            <path d="M34 26C38 23 46 19 48 13C46 10 40 12 36 18C34 21 34 26 34 26Z" fill="url(#sprout_sheen_1)" opacity="0.6" />
            <circle cx="24" cy="18" r="1.5" fill="#ffffff" />
            <circle cx="42" cy="14" r="1.2" fill="#ffffff" />
          </g>
        </svg>
      );

    case 2:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <defs>
            <radialGradient id="zap_floor_2" cx="50%" cy="85%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="zap_bevel_2" x1="16" y1="8" x2="48" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="zap_front_2" x1="38" y1="6" x2="22" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="25%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="85%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="zap_spine_2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
            </linearGradient>
            <filter id="zap_shadow_2" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="3.5" floodColor="#0284c7" floodOpacity="0.45" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="5" fill="url(#zap_floor_2)" />
          <g filter="url(#zap_shadow_2)">
            <polygon
              points="38,6 20,32 33,32 23,58 47,26 34,26"
              fill="url(#zap_bevel_2)"
              transform="translate(2.5, 2.5)"
            />
            <polygon
              points="38,6 20,32 33,32 23,58 47,26 34,26"
              fill="url(#zap_front_2)"
              stroke="#7dd3fc"
              strokeWidth="0.75"
            />
            <path
              d="M38 6L20 32H33L23 58"
              stroke="url(#zap_spine_2)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx="33" cy="30" rx="3" ry="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="45" cy="18" r="1.3" fill="#bae6fd" />
            <circle cx="16" cy="38" r="1.1" fill="#7dd3fc" />
            <circle cx="39" cy="48" r="1.4" fill="#ffffff" />
          </g>
        </svg>
      );

    case 3:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <defs>
            <radialGradient id="cap_floor_3" cx="50%" cy="85%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cap_board_top_3" x1="10" y1="18" x2="54" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="30%" stopColor="#4f46e5" />
              <stop offset="70%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3730a3" />
            </linearGradient>
            <linearGradient id="cap_board_edge_3" x1="10" y1="30" x2="54" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="cap_skull_3" x1="22" y1="32" x2="42" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="50%" stopColor="#3730a3" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="cap_tassel_3" x1="32" y1="24" x2="16" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <filter id="cap_shadow_3" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#1e1b4b" floodOpacity="0.4" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="5" fill="url(#cap_floor_3)" />
          <g filter="url(#cap_shadow_3)">
            <path d="M22 32C22 32 21 44 32 46C43 44 42 32 42 32" fill="url(#cap_skull_3)" />
            <path d="M22 34C24 42 40 42 42 34" stroke="#4f46e5" strokeWidth="1" fill="none" opacity="0.6" />
            <polygon points="32,26 54,34 54,37 32,45 10,37 10,34" fill="url(#cap_board_edge_3)" />
            <polygon points="32,18 54,34 32,42 10,34" fill="url(#cap_board_top_3)" stroke="#818cf8" strokeWidth="0.75" />
            <path d="M32 18L10 34L32 42" stroke="#a5b4fc" strokeWidth="1" fill="none" opacity="0.6" />
            <ellipse cx="32" cy="30" rx="2.5" ry="1.8" fill="#fef08a" />
            <path d="M32 30C28 32 20 34 18 42L16 46" stroke="url(#cap_tassel_3)" strokeWidth="2.2" strokeLinecap="round" />
            <polygon points="15,44 19,45 17,50" fill="url(#cap_tassel_3)" />
          </g>
        </svg>
      );

    case 4:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <defs>
            <radialGradient id="code_floor_4" cx="50%" cy="85%" r="50%">
              <stop offset="0%" stopColor="#d946ef" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cube_top_4" x1="16" y1="12" x2="48" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="cube_left_4" x1="14" y1="28" x2="32" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
            <linearGradient id="cube_right_4" x1="32" y1="28" x2="50" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="50%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
            <filter id="code_shadow_4" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#581c87" floodOpacity="0.4" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="5" fill="url(#code_floor_4)" />
          <g filter="url(#code_shadow_4)">
            <polygon points="32,10 50,22 32,32 14,22" fill="url(#cube_top_4)" stroke="#f0abfc" strokeWidth="0.75" />
            <polygon points="14,22 32,32 32,54 14,44" fill="url(#cube_left_4)" stroke="#c084fc" strokeWidth="0.75" />
            <polygon points="32,32 50,22 50,44 32,54" fill="url(#cube_right_4)" stroke="#9333ea" strokeWidth="0.75" />
            <path d="M26 34L20 38L26 42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M30 45L34 32" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M38 34L44 38L38 42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="10" r="1.4" fill="#ffffff" />
          </g>
        </svg>
      );

    case 5:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <defs>
            <radialGradient id="gem_floor_5" cx="50%" cy="85%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="gem_table_5" x1="20" y1="12" x2="44" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="gem_f1_5" x1="12" y1="18" x2="32" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#9a3412" />
            </linearGradient>
            <linearGradient id="gem_f2_5" x1="32" y1="24" x2="32" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
            <linearGradient id="gem_f3_5" x1="52" y1="18" x2="32" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            <filter id="gem_shadow_5" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#7c2d12" floodOpacity="0.4" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="5" fill="url(#gem_floor_5)" />
          <g filter="url(#gem_shadow_5)">
            <polygon points="20,12 44,12 54,24 10,24" fill="url(#gem_table_5)" stroke="#fef9c3" strokeWidth="0.75" />
            <polygon points="20,12 32,24 10,24" fill="#f59e0b" opacity="0.8" />
            <polygon points="44,12 54,24 32,24" fill="#d97706" opacity="0.8" />
            <polygon points="20,12 44,12 32,24" fill="#fef08a" opacity="0.9" />
            <polygon points="10,24 22,24 32,54" fill="url(#gem_f1_5)" stroke="#fef08a" strokeWidth="0.5" />
            <polygon points="22,24 42,24 32,54" fill="url(#gem_f2_5)" stroke="#ffffff" strokeWidth="0.5" />
            <polygon points="42,24 54,24 32,54" fill="url(#gem_f3_5)" stroke="#ea580c" strokeWidth="0.5" />
            <g transform="translate(42, 8) scale(0.8)">
              <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8L5 0Z" fill="#ffffff" />
            </g>
          </g>
        </svg>
      );

    case 6:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <defs>
            <radialGradient id="crown_floor_6" cx="50%" cy="85%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="crown_gold_6" x1="12" y1="14" x2="52" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="80%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="crown_velvet_6" x1="20" y1="26" x2="44" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="50%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <filter id="crown_shadow_6" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#881337" floodOpacity="0.4" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="5" fill="url(#crown_floor_6)" />
          <g filter="url(#crown_shadow_6)">
            <path d="M18 42C18 28 46 28 46 42Z" fill="url(#crown_velvet)" />
            <path
              d="M12 44L14 20L23 32L32 14L41 32L50 20L52 44Z"
              fill="url(#crown_gold_6)"
              stroke="#fef08a"
              strokeWidth="0.75"
            />
            <rect x="12" y="44" width="40" height="7" rx="2" fill="url(#crown_gold_6)" stroke="#ca8a04" strokeWidth="0.75" />
            <circle cx="14" cy="20" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.75" />
            <circle cx="32" cy="14" r="3" fill="#e11d48" stroke="#fef08a" strokeWidth="0.75" />
            <circle cx="50" cy="20" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.75" />
            <ellipse cx="22" cy="47.5" rx="2" ry="1.5" fill="#10b981" />
            <ellipse cx="32" cy="47.5" rx="2.5" ry="1.8" fill="#e11d48" />
            <ellipse cx="42" cy="47.5" rx="2" ry="1.5" fill="#3b82f6" />
            <path d="M14 44L23 32L32 14" stroke="#ffffff" strokeWidth="1" opacity="0.6" fill="none" />
          </g>
        </svg>
      );

    case 7:
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <defs>
            <radialGradient id="trophy_floor_7" cx="50%" cy="85%" r="50%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="trophy_gold_7" x1="16" y1="12" x2="48" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="15%" stopColor="#fde047" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="90%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>
            <linearGradient id="trophy_spec_7" x1="26" y1="12" x2="33" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trophy_handle_7" x1="8" y1="14" x2="56" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>
            <linearGradient id="trophy_ped_7" x1="20" y1="46" x2="44" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="30%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="trophy_rim_7" x1="18" y1="10" x2="46" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <filter id="trophy_shadow_7" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#713f12" floodOpacity="0.35" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <ellipse cx="32" cy="56" rx="20" ry="5" fill="url(#trophy_floor_7)" />
          <g filter="url(#trophy_shadow_7)">
            <path d="M20 18C12 18 9 24 9 29C9 34 13 37 19 37L20 33C15.5 33 13 30.5 13 28C13 24.5 15.5 22 20 22V18Z" fill="url(#trophy_handle_7)" />
            <path d="M44 18C52 18 55 24 55 29C55 34 51 37 45 37L44 33C48.5 33 51 30.5 51 28C51 24.5 48.5 22 44 22V18Z" fill="url(#trophy_handle_7)" />
            <path d="M18 12H46V28C46 36 39.5 42 32 42C24.5 42 18 36 18 28V12Z" fill="url(#trophy_gold_7)" />
            <path d="M22 13H27V28C27 33 25.5 37 23 39C21 36 20 31.5 20 28V13H22Z" fill="url(#trophy_spec_7)" />
            <ellipse cx="32" cy="12" rx="14" ry="3.5" fill="url(#trophy_rim_7)" />
            <ellipse cx="32" cy="12" rx="12" ry="2.2" fill="#854d0e" opacity="0.6" />
            <path d="M28 42H36V47H28V42Z" fill="url(#trophy_gold_7)" />
            <ellipse cx="32" cy="47" rx="6" ry="1.8" fill="#ca8a04" />
            <path d="M24 48H40L42 53H22L24 48Z" fill="url(#trophy_ped_7)" />
            <rect x="20" y="53" width="24" height="5" rx="1.5" fill="url(#trophy_ped_7)" stroke="#ca8a04" strokeWidth="0.75" />
            <rect x="25" y="54" width="14" height="2.5" rx="0.5" fill="url(#trophy_gold_7)" />
          </g>
          <g transform="translate(42, 9) scale(0.9)">
            <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8L5 0Z" fill="#ffffff" />
            <circle cx="5" cy="5" r="1.2" fill="#fef08a" />
          </g>
        </svg>
      );
  }
};

export const CareerProfile: React.FC = () => {
  const { isDataLoading } = useApp();

  // 🌟 3-Tab Division State: overview | career_data | settings
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'career_data' | 'settings'>('overview');

  if (isDataLoading) {
    return <SkeletonProfilePage />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 w-full px-3.5 sm:px-6 lg:px-8 animate-in fade-in duration-150">
      {/* 🌟 3-Tab Profile Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setProfileActiveTab('overview')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              profileActiveTab === 'overview'
                ? 'bg-white dark:bg-[#1f1f23] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 size={16} className="shrink-0" />
            <span className="hidden sm:inline">Overview &amp; Momentum</span>
            <span className="sm:hidden">Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileActiveTab('career_data')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              profileActiveTab === 'career_data'
                ? 'bg-white dark:bg-[#1f1f23] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User size={16} className="shrink-0" />
            <span className="hidden sm:inline">Career Data</span>
            <span className="sm:hidden">Career</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileActiveTab('settings')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              profileActiveTab === 'settings'
                ? 'bg-white dark:bg-[#1f1f23] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings size={16} className="shrink-0" />
            <span>Settings</span>
          </button>
        </div>

        {/* Quick status pill on right */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Discipline Engine</span>
        </div>
      </div>

      {/* Tab 1: Overview & Momentum */}
      {profileActiveTab === 'overview' && (
        <ProfileOverviewTab />
      )}

      {/* Tab 2: Career Data & Portfolio */}
      {profileActiveTab === 'career_data' && (
        <ProfileCareerDataTab />
      )}

      {/* Tab 3: Settings & Integrations */}
      {profileActiveTab === 'settings' && (
        <ProfileSettingsTab />
      )}
    </div>
  );
};
