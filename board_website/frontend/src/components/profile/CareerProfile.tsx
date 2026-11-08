import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getApiEndpoint } from '../../services/api';
import { SkeletonProfilePage } from '../common/SkeletonLoader';
import {
  Flame,
  Download,
  Database,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  Folder,
  Briefcase,
  Layers,
  Copy,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Sparkles,
  Calendar,
  Lock,
  LogIn,
  Mail,
  HardDrive,
  Code2,
  Sprout,
  Zap,
  GraduationCap,
  Gem,
  Crown,
  Trophy,
  LucideIcon,
  CheckCircle2,
  Clock,
} from 'lucide-react';

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
  const {
    profile,
    quickLinks,
    addQuickLink,
    removeQuickLink,
    gamification,
    applications,
    learnings,
    setIsDriveModalOpen,
    gdriveStatus,
    showToast,
    isAuthenticated,
    openAuthModal,
    storageMode,
    requestStorageModeChange,
    currentUser,
    isDsaEnabled,
    toggleDsaTrack,
    isDataLoading,
  } = useApp();

  // Momentum Activity Matrix Date controls
  const [momentumDate, setMomentumDate] = useState(() => new Date());
  const [hoveredMatrixDay, setHoveredMatrixDay] = useState<{
    dateStr: string;
    dayNum: number;
    count: number;
    type: 'applications' | 'learnings';
    isToday: boolean;
  } | null>(null);

  // Add / Edit Quick Link Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal();
    }
  }, [isAuthenticated, openAuthModal]);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#18181b]/95 p-8 text-center shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Sign In to Access Career Hub
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Your career profile, tailored resume versions, activity heatmap, and personal Google Drive files are private and require an active session.
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <LogIn size={16} strokeWidth={2.5} />
            <span>Sign In to Job Tracker</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedYear = momentumDate.getFullYear();
  const selectedMonth = momentumDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = [2024, 2025, 2026, 2027];

  const stepMonth = (offset: number) => {
    setMomentumDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const setMonthByIndex = (m: number) => {
    setMomentumDate(prev => new Date(prev.getFullYear(), m, 1));
  };

  const setYearByValue = (y: number) => {
    setMomentumDate(prev => new Date(y, prev.getMonth(), 1));
  };

  const resetToCurrentMonth = () => {
    setMomentumDate(new Date());
  };

  // Copy Quick Link
  const copyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
    showToast('Copied link to clipboard');
  };

  // Open Link Modal (Add or Edit)
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

  // Export applications to CSV
  const exportToCSV = () => {
    const headers = ['Company', 'Role', 'Stage', 'Category', 'Country', 'City', 'Date Applied', 'Deadline', 'Salary'];
    const rows = applications.map(a => [
      `"${a.company || ''}"`,
      `"${a.role || ''}"`,
      `"${a.stage || ''}"`,
      `"${a.category || ''}"`,
      `"${a.country || ''}"`,
      `"${a.city || ''}"`,
      `"${a.date_applied || ''}"`,
      `"${a.deadline || ''}"`,
      `"${a.salary || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `job_applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported applications to CSV');
  };

  // -------------------------------------------------------------
  // Activity Matrix Calculation
  // -------------------------------------------------------------
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const toYMD = (d: number) =>
    `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayYMD = new Date().toISOString().slice(0, 10);

  // Group applications and learnings by date string YYYY-MM-DD
  const appsByDate: Record<string, number> = {};
  applications.forEach(a => {
    const d = (a.date_applied || '').slice(0, 10);
    if (d) appsByDate[d] = (appsByDate[d] || 0) + 1;
  });

  const learningsByDate: Record<string, number> = {};
  learnings.forEach(l => {
    const d = (l.date_logged || '').slice(0, 10);
    if (d) learningsByDate[d] = (learningsByDate[d] || 0) + 1;
  });

  // Calculate month activities & active days
  let monthAppsTotal = 0;
  let monthLearningsTotal = 0;
  let monthActiveDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toYMD(d);
    const appCnt = appsByDate[dateStr] || 0;
    const learnCnt = learningsByDate[dateStr] || 0;
    monthAppsTotal += appCnt;
    monthLearningsTotal += learnCnt;
    if (appCnt > 0 || learnCnt > 0) monthActiveDays++;
  }

  // Build weekly column structure (Monday=0 to Sunday=6)
  interface DayCellData {
    dayNum: number | null;
    dateStr: string | null;
    count: number;
    isToday: boolean;
  }

  const buildMonthGrid = (countMap: Record<string, number>) => {
    const weeks: DayCellData[][] = [];
    let currentWeek: DayCellData[] = [];

    // First day of month (0=Sun, 1=Mon, ..., 6=Sat)
    // Convert to Monday=0 .. Sunday=6
    const firstDayIndex = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;

    // Pad beginning of first week
    for (let p = 0; p < firstDayIndex; p++) {
      currentWeek.push({ dayNum: null, dateStr: null, count: 0, isToday: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toYMD(day);
      const count = countMap[dateStr] || 0;
      currentWeek.push({
        dayNum: day,
        dateStr,
        count,
        isToday: dateStr === todayYMD,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Pad end of last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ dayNum: null, dateStr: null, count: 0, isToday: false });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const appWeeks = buildMonthGrid(appsByDate);
  const learnWeeks = buildMonthGrid(learningsByDate);

  const getAppCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
    const c = cell.count;
    if (c === 0) return 'bg-slate-200/70 dark:bg-[#1b2230] border-slate-300/40 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20';
    if (c === 1) return 'bg-blue-200 dark:bg-[#163354] border-blue-300/80 dark:border-blue-700/60';
    if (c === 2) return 'bg-blue-400 dark:bg-[#1d4ed8] border-blue-500 dark:border-blue-600';
    if (c === 3) return 'bg-blue-600 dark:bg-[#2563eb] border-blue-700 dark:border-blue-500 shadow-2xs shadow-blue-500/20';
    return 'bg-blue-700 dark:bg-[#3b82f6] border-blue-800 dark:border-blue-400 shadow-xs shadow-blue-500/30';
  };

  const getLearnCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
    const c = cell.count;
    if (c === 0) return 'bg-slate-200/70 dark:bg-[#1b2230] border-slate-300/40 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20';
    if (c === 1) return 'bg-emerald-200 dark:bg-[#064e3b] border-emerald-300/80 dark:border-emerald-700/60';
    if (c === 2) return 'bg-emerald-400 dark:bg-[#059669] border-emerald-500 dark:border-emerald-600';
    if (c === 3) return 'bg-emerald-600 dark:bg-[#10b981] border-emerald-700 dark:border-emerald-500 shadow-2xs shadow-emerald-500/20';
    return 'bg-emerald-700 dark:bg-[#34d399] border-emerald-800 dark:border-emerald-400 shadow-xs shadow-emerald-500/30';
  };

  // -------------------------------------------------------------
  // Pipeline Stats Calculation
  // -------------------------------------------------------------
  const totalApps = applications.length;
  const interviewingApps = applications.filter(a => a.stage === 'Interviewing').length;
  const offerApps = applications.filter(a => a.stage === 'Offer').length;
  const appliedApps = applications.filter(a => a.stage === 'Applied').length;
  const rejectedApps = applications.filter(a => a.stage === 'Rejected').length;
  const responseRate = totalApps > 0 ? (((interviewingApps + offerApps) / totalApps) * 100).toFixed(1) : '0';

  const pct = (val: number) => totalApps > 0 ? Math.round((val / totalApps) * 100) : 0;

  // Top locations
  const countryCounts: Record<string, number> = {};
  applications.forEach(a => {
    const c = a.country || 'Remote';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const topLocations = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, n]) => `${c} (${n})`)
    .join(', ') || 'Various';

  // -------------------------------------------------------------
  // Learnings Stats Calculation (Dynamic according to user topics)
  // -------------------------------------------------------------
  const streak = gamification.streak || 0;
  const studyHours = (gamification.totalMinutes / 60).toFixed(1);
  const totalLearningsCount = learnings.length;
  const userLevel = gamification.level || 1;
  const userLevelTitle = gamification.levelTitle || 'Novice Scout';
  const totalXP = gamification.totalXP || 0;
  const progressPercent = gamification.progressPercent || 0;
  const currentTierConfig = TROPHY_TIER_CONFIG[userLevel] || TROPHY_TIER_CONFIG[1];
  const RankIcon = currentTierConfig.icon;
  const nextTierConfig = TROPHY_TIER_CONFIG[userLevel + 1];

  // Aggregate user's dynamic topics
  const topicStatsMap: Record<string, { count: number; minutes: number }> = {};
  learnings.forEach((l) => {
    const rawTopic = (l.topic && l.topic.trim()) || (l.category && l.category.trim()) || 'General';
    const topicKey = rawTopic.trim();
    if (!topicKey) return;
    if (!topicStatsMap[topicKey]) {
      topicStatsMap[topicKey] = { count: 0, minutes: 0 };
    }
    topicStatsMap[topicKey].count += 1;
    topicStatsMap[topicKey].minutes += Number(l.duration_minutes) || 0;
  });

  const uniqueTopicsCount = Object.keys(topicStatsMap).length;

  // Sorted dynamic topics by frequency and study time
  const dynamicTopics = Object.entries(topicStatsMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      minutes: data.minutes,
      pct: totalLearningsCount > 0 ? Math.round((data.count / totalLearningsCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || b.minutes - a.minutes);

  const DYNAMIC_TOPIC_COLORS = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-blue-500',
    'bg-teal-500',
    'bg-orange-500',
  ];

  if (isDataLoading) {
    return <SkeletonProfilePage />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 w-full">
      {/* 1. Top Hero Section Divided into 2 Cards: Left (User Info) and Right (Storage & Export) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Section: User Profile Avatar, Name, Email, Streaks */}
        <section
          className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-start gap-4"
          aria-label="User Profile Details"
        >
          {(() => {
            const userEmail = currentUser?.email || profile?.email || '';
            const isOAuth = Boolean(
              currentUser?.is_google ||
              currentUser?.auth_provider === 'google' ||
              Boolean(currentUser?.picture) ||
              Boolean(currentUser?.avatar_url)
            );

            // If normal email: strictly name before '@'; if OAuth: name from OAuth or profile
            const emailPrefix = userEmail.includes('@') ? userEmail.split('@')[0] : (userEmail || 'User');
            const displayName = isOAuth
              ? (currentUser?.name?.trim() || profile.full_name?.trim() || emailPrefix)
              : emailPrefix;

            // Only fetch/display profile image if user logged in with OAuth
            const oauthAvatarUrl = isOAuth
              ? (currentUser?.picture || currentUser?.avatar_url || currentUser?.photo_url || null)
              : null;

            const avatarInitials = (displayName || emailPrefix)
              .split(/[\s._-]+/)
              .filter(Boolean)
              .map((s: string) => s[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'U';

            return (
              <div className="flex flex-col gap-4">
                {/* User Profile Avatar, Name, Email */}
                <div className="flex items-center gap-4 sm:gap-5">
                  {oauthAvatarUrl ? (
                    <img
                      src={oauthAvatarUrl}
                      alt={displayName}
                      className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl object-cover shadow-md ring-4 ring-white dark:ring-[#141417] border border-slate-200/60 dark:border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-xl sm:text-2xl shadow-md ring-4 ring-white dark:ring-[#141417]">
                      {avatarInitials}
                    </div>
                  )}

                  {/* Details: Name & Email */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Name */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Name:
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white m-0 truncate">
                        {displayName}
                      </h1>
                      {isOAuth && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          OAuth
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Mail size={15} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-xs text-slate-400 dark:text-slate-500">
                        Email:
                      </span>
                      <span className="font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                        {userEmail || 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2 Small Side-by-Side Subsections: 3D Fire Streak & 3D Trophy */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  {/* Subsection 1: 3D Realistic Fire Streak */}
                  <div className="relative overflow-hidden rounded-2xl border border-orange-500/25 dark:border-orange-500/25 bg-gradient-to-b from-orange-500/[0.08] via-amber-500/[0.03] to-transparent dark:from-orange-500/10 dark:via-amber-500/5 dark:to-transparent p-3.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-xs hover:border-orange-500/45 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-200 group">
                    {/* 3D Realistic Fire Icon */}
                    <div className="relative mb-2 flex items-center justify-center">
                      <svg
                        width="46"
                        height="46"
                        viewBox="0 0 64 64"
                        fill="none"
                        className="transition-transform duration-300 group-hover:scale-105"
                      >
                        <defs>
                          <radialGradient id="fireFloorGlow" cx="50%" cy="85%" r="50%">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                          </radialGradient>
                          <linearGradient id="flameOuterGrad" x1="16" y1="56" x2="48" y2="8" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#991b1b" />
                            <stop offset="20%" stopColor="#c2410c" />
                            <stop offset="55%" stopColor="#ea580c" />
                            <stop offset="85%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#fb923c" />
                          </linearGradient>
                          <linearGradient id="flameMidGrad" x1="22" y1="54" x2="42" y2="16" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ea580c" />
                            <stop offset="35%" stopColor="#f59e0b" />
                            <stop offset="75%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#fde047" />
                          </linearGradient>
                          <linearGradient id="flameCoreGrad" x1="26" y1="52" x2="38" y2="28" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="40%" stopColor="#fef08a" />
                            <stop offset="100%" stopColor="#ffffff" />
                          </linearGradient>
                          <linearGradient id="flameSheen" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </linearGradient>
                          <filter id="flameShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#7c2d12" floodOpacity="0.4" />
                            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
                          </filter>
                        </defs>

                        {/* Ambient base glow */}
                        <ellipse cx="32" cy="52" rx="20" ry="6" fill="url(#fireFloorGlow)" />

                        {/* Volumetric outer flame */}
                        <g filter="url(#flameShadow)">
                          <path
                            d="M32 6C32 6 38 14 38 22C38 25 36.8 27.5 35 29C42 26 48 33 48 41C48 50.5 40.5 58 32 58C23.5 58 16 50.5 16 41C16 31 23 24 29 17C32 13 32 6 32 6Z"
                            fill="url(#flameOuterGrad)"
                          />
                          <path
                            d="M32 8C32 8 29.5 14 27 18C21.5 25 18 31.5 18 41C18 45.5 20 49.5 23 52.5C20 48.5 19.5 43.5 20 39C20.5 33 24 27 28 21C30.5 16.5 32 8 32 8Z"
                            fill="url(#flameSheen)"
                            opacity="0.6"
                          />
                        </g>

                        {/* Dynamic mid flame tongue */}
                        <path
                          d="M32 20C32 20 36.5 26 36.5 31C36.5 33.5 35.5 35 34 36C38 35 41.5 39 41.5 44C41.5 49.5 37 54 32 54C27 54 22.5 49.5 22.5 44C22.5 37.5 27 32 30 27C32 23.5 32 20 32 20Z"
                          fill="url(#flameMidGrad)"
                        />

                        {/* White-hot concentrated core */}
                        <path
                          d="M32 33C32 33 34.5 37 34.5 40C34.5 41.5 33.8 42.5 33 43C35.5 42.5 37 45 37 47.5C37 51 34.8 52.5 32 52.5C29.2 52.5 27 51 27 47.5C27 43.5 29.5 39.5 31 36.5C32 34.5 32 33 32 33Z"
                          fill="url(#flameCoreGrad)"
                        />

                        <ellipse cx="32" cy="46" rx="2" ry="3.5" fill="#ffffff" opacity="0.9" />
                        <circle cx="44" cy="22" r="1.5" fill="#fde047" opacity="0.8" />
                        <circle cx="20" cy="26" r="1.2" fill="#fb923c" opacity="0.75" />
                        <circle cx="36" cy="12" r="1" fill="#fef08a" opacity="0.85" />
                      </svg>
                    </div>

                    {/* streak: [number] */}
                    <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                      streak:{' '}
                      <span className="font-black text-orange-500 dark:text-orange-400 text-sm sm:text-base tabular-nums">
                        {streak}
                      </span>
                    </div>
                  </div>

                  {/* Subsection 2: 3D Rank Icon & Name (Dynamic by current unlocked tier) */}
                  <div className={`relative overflow-hidden rounded-2xl border ${currentTierConfig.border} bg-gradient-to-b ${currentTierConfig.bg} via-transparent to-transparent p-3.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md transition-all duration-200 group`}>
                    {/* 3D Tier Icon Pod (Sprout, Zap, Scholar Cap, Code, Gem, Crown, Trophy) */}
                    <div className="relative mb-2 flex items-center justify-center">
                      <Tier3DIcon
                        tier={userLevel}
                        size={46}
                        className="transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
                      />
                    </div>

                    {/* Name of trophy / rank */}
                    <div
                      className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-full tracking-tight"
                      title={userLevelTitle}
                    >
                      {userLevelTitle}
                    </div>
                  </div>
                </div>

                {/* Level XP Progress Bar below the 2 subsections */}
                <div className="pt-1.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">
                      <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{totalXP.toLocaleString()}</strong> XP Total
                    </span>
                    <span className="tabular-nums font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {progressPercent}% to {nextTierConfig ? `Level ${userLevel + 1} (${nextTierConfig.title})` : 'Grandmaster Max'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
                    <div
                      className={`h-full bg-gradient-to-r ${currentTierConfig.gradient} rounded-full transition-all duration-700 shadow-2xs`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Right Section: Storage Mode Toggle | G-Drive | Sync | Download as CSV */}
        <section
          className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4"
          aria-label="Storage Mode and Export Controls"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <HardDrive size={13} className="text-indigo-500" />
                <span>Storage Engine</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {storageMode === 'local_storage' ? 'Local Storage Active' : 'Google Drive Active'}
              </span>
            </div>

            {/* Enhanced UI for LOCAL_STORAGE / G_DRIVE Toggle */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#1a1a1e] border border-slate-200 dark:border-white/10 relative">
              {/* Local Storage Pill */}
              <button
                type="button"
                onClick={() => storageMode !== 'local_storage' && requestStorageModeChange('local_storage')}
                className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  storageMode === 'local_storage'
                    ? 'bg-white dark:bg-[#27272a] text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/80 dark:border-white/10 ring-1 ring-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <HardDrive size={14} className={storageMode === 'local_storage' ? 'text-indigo-500' : 'text-slate-400'} />
                <span>LOCAL_STORAGE</span>
                {storageMode === 'local_storage' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>

              {/* Google Drive Pill */}
              <button
                type="button"
                onClick={() => storageMode !== 'g_drive' && requestStorageModeChange('g_drive')}
                className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  storageMode === 'g_drive'
                    ? 'bg-white dark:bg-[#27272a] text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200/80 dark:border-white/10 ring-1 ring-blue-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <svg viewBox="0 0 87.3 78" width="14" height="12.5" className="shrink-0">
                  <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L29 52.2H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
                  <path d="M43.65 25.15L29.05 0c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.35.6-.55 1.2-.7 1.85h29z" fill="#00AC47" />
                  <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.7c.8-1.4 1.2-2.95 1.2-4.5H58.3L73.55 76.8z" fill="#EA4335" />
                  <path d="M43.65 25.15L58.25 0H29.05l14.6 25.15z" fill="#00832D" />
                  <path d="M58.3 52.2H29L13.75 76.8c1.35.8 2.85 1.2 4.45 1.2H69.1c1.6 0 3.1-.45 4.45-1.2z" fill="#2684FC" />
                  <path d="M73.4 26.5L58.25 0c-1.35.8-2.5 1.9-3.3 3.3L43.65 25.15 58.3 52.2h29c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
                </svg>
                <span>G_DRIVE</span>
                {storageMode === 'g_drive' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons: G-Drive/Local Storage Settings | Mirror & Sync | Download as CSV */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {storageMode === 'local_storage' ? (
              <button
                type="button"
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                onClick={() => setIsDriveModalOpen(true)}
                title="View & Configure Local Storage Path"
              >
                <Folder size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Local Storage</span>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
              </button>
            ) : (
              <button
                type="button"
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                onClick={() => setIsDriveModalOpen(true)}
                title="Manage Your Google Drive Storage & Setup"
              >
                <svg viewBox="0 0 87.3 78" width="14" height="12.5" className="shrink-0">
                  <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L29 52.2H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
                  <path d="M43.65 25.15L29.05 0c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.35.6-.55 1.2-.7 1.85h29z" fill="#00AC47" />
                  <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.7c.8-1.4 1.2-2.95 1.2-4.5H58.3L73.55 76.8z" fill="#EA4335" />
                  <path d="M43.65 25.15L58.25 0H29.05l14.6 25.15z" fill="#00832D" />
                  <path d="M58.3 52.2H29L13.75 76.8c1.35.8 2.85 1.2 4.45 1.2H69.1c1.6 0 3.1-.45 4.45-1.2z" fill="#2684FC" />
                  <path d="M73.4 26.5L58.25 0c-1.35.8-2.5 1.9-3.3 3.3L43.65 25.15 58.3 52.2h29c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
                </svg>
                <span>G-Drive</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    gdriveStatus.connected ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-amber-500'
                  }`}
                  title={gdriveStatus.connected ? 'Google Drive Connected' : 'Google Drive Disconnected'}
                />
              </button>
            )}

            {/* Download as CSV Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              onClick={exportToCSV}
              title="Export all Job Applications to CSV for Excel / Spreadsheets"
            >
              <Download size={13} className="text-emerald-500 shrink-0" />
              <span>Download as CSV</span>
            </button>
          </div>

          {/* DSA Subsection (Progressive DSA Practice Roadmap) */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Code2 size={13} className="text-purple-500" />
                <span>DSA Track</span>
              </span>
              <span
                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                  isDsaEnabled
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10'
                }`}
              >
                {isDsaEnabled ? 'Active in Navbar' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span>Want to be progressive in DSA?</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">
                    <Sparkles size={10} /> 78 Curated Challenges
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5 leading-relaxed">
                  Toggle on to access structured LeetCode sheets and count algorithm solves toward your daily streak quest (+25 XP).
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => toggleDsaTrack(!isDsaEnabled)}
                role="switch"
                aria-checked={isDsaEnabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
                  isDsaEnabled ? 'bg-purple-600 dark:bg-purple-500' : 'bg-slate-300 dark:bg-white/20'
                }`}
                title={isDsaEnabled ? 'Disable DSA Track' : 'Enable DSA Track'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isDsaEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 2. 2-Card Row: Left = Quick Links & Profiles | Right = Activity & Momentum Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Card: Quick Links & Profiles */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <ExternalLink size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Quick Links &amp; Profiles</span>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              onClick={openAddLinkModal}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Link</span>
            </button>
          </div>

          {/* Links List Container */}
          <div className="space-y-2.5 flex-1 max-h-[380px] overflow-y-auto pr-1">
            {quickLinks.map(link => {
              const isEmail = link.url.includes('@') && !link.url.startsWith('http');
              const href = isEmail ? `mailto:${link.url}` : link.url;

              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-500/20">
                      <ExternalLink size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {link.title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {link.url}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Open / Copy / Edit / Delete */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors no-underline"
                    >
                      {isEmail ? 'Send ↗' : 'Open ↗'}
                    </a>

                    <button
                      type="button"
                      onClick={() => copyLink(link.url, link.id)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedLink === link.id ? (
                        <CheckCheck size={12} className="text-emerald-500 inline" />
                      ) : (
                        'Copy'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditLinkModal(link)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit Link"
                    >
                      <Sparkles size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeQuickLink(link.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove Link"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Card: Single Month Activity Matrix (Apps & Learnings separated) */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Briefcase size={16} className="text-blue-600" />
                <span>Activity &amp; Momentum</span>
              </div>
              <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{monthAppsTotal + monthLearningsTotal} activities in </span>
                <strong className="text-slate-900 dark:text-white font-bold">
                  {monthNames[selectedMonth]} {selectedYear}
                </strong>
              </div>
            </div>

            {/* Month & Year Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => stepMonth(-1)}
                className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>

              <select
                value={selectedMonth}
                onChange={e => setMonthByIndex(Number(e.target.value))}
                className="h-6 px-1.5 rounded-lg border-0 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {shortMonths.map((m, idx) => (
                  <option key={m} value={idx} className="bg-white dark:bg-[#18181b]">{m}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={e => setYearByValue(Number(e.target.value))}
                className="h-6 px-1.5 rounded-lg border-0 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-[#18181b]">{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => stepMonth(1)}
                className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={resetToCurrentMonth}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Jump to Current Month"
              >
                Today
              </button>
            </div>
          </div>

          {/* Live Hover Info Banner - Displays the exact Day and Count */}
          <div className="flex items-center justify-between px-3.5 py-2 mb-2 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 text-xs min-h-[42px] transition-all">
            {hoveredMatrixDay ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar size={13} className={hoveredMatrixDay.type === 'applications' ? 'text-blue-500' : 'text-emerald-500'} />
                  <span>
                    {(() => {
                      const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const d = new Date(selectedYear, selectedMonth, hoveredMatrixDay.dayNum);
                      const dayOfWeek = daysNames[d.getDay()];
                      return `${dayOfWeek}, ${monthNames[selectedMonth]} ${hoveredMatrixDay.dayNum}, ${selectedYear}`;
                    })()}
                  </span>
                </span>
                <span className="text-slate-400 font-bold">&bull;</span>
                <span
                  className={`font-black px-2.5 py-0.5 rounded-lg text-xs shadow-2xs flex items-center gap-1.5 ${
                    hoveredMatrixDay.type === 'applications'
                      ? 'bg-blue-600 text-white shadow-blue-500/25'
                      : 'bg-emerald-600 text-white shadow-emerald-500/25'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>
                    {hoveredMatrixDay.count}{' '}
                    {hoveredMatrixDay.type === 'applications'
                      ? `Job Application${hoveredMatrixDay.count === 1 ? '' : 's'}`
                      : `Learning Note${hoveredMatrixDay.count === 1 ? '' : 's'}`}
                  </span>
                </span>
                {hoveredMatrixDay.isToday && (
                  <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 rounded-md shadow-2xs">
                    🔥 Today
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-indigo-500" />
                  <span className="font-semibold">
                    <strong className="text-slate-900 dark:text-white font-black">{monthActiveDays} active days</strong> ({Math.round((monthActiveDays / daysInMonth) * 100)}% consistency) in {monthNames[selectedMonth]}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                  Hover any cell for daily details
                </span>
              </div>
            )}
          </div>

          {/* Dual Month Activity Blocks: Apps (Left) & Learnings (Right) */}
          <div
            onMouseLeave={() => setHoveredMatrixDay(null)}
            className="flex gap-4 sm:gap-6 items-stretch justify-around my-2.5 px-4 py-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] overflow-x-auto"
          >
            {/* Job Applications Block */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-[160px]">
              <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Briefcase size={13} />
                  <span>Job Applications</span>
                </span>
                <span
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                    monthAppsTotal > 0
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                      : 'text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {monthAppsTotal} applications
                </span>
              </div>

              {/* Grid wrap with days legend (Mon, Wed, Fri) and week columns */}
              <div className="flex gap-2 items-start">
                <div className="grid grid-rows-7 gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 select-none">
                  <div className="h-[18px] flex items-center leading-none">Mon</div>
                  <div className="h-[18px]" />
                  <div className="h-[18px] flex items-center leading-none">Wed</div>
                  <div className="h-[18px]" />
                  <div className="h-[18px] flex items-center leading-none">Fri</div>
                  <div className="h-[18px]" />
                  <div className="h-[18px]" />
                </div>

                <div className="flex gap-1.5 flex-1">
                  {appWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1.5">
                      {week.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          onMouseEnter={() => {
                            if (cell.dayNum && cell.dateStr) {
                              setHoveredMatrixDay({
                                dateStr: cell.dateStr,
                                dayNum: cell.dayNum,
                                count: cell.count,
                                type: 'applications',
                                isToday: cell.isToday,
                              });
                            }
                          }}
                          className={`relative group/cell w-[18px] h-[18px] rounded-[5px] border transition-all duration-150 cursor-pointer ${getAppCellClass(cell)} ${
                            cell.isToday ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-[#141417]' : ''
                          } hover:ring-2 hover:ring-blue-500/80 hover:scale-110 hover:z-30 hover:shadow-md`}
                        >
                          {/* Modern Floating Popover */}
                          {cell.dayNum && (
                            <div
                              className={`hidden group-hover/cell:flex pointer-events-none absolute ${
                                cIdx <= 2 ? 'top-full mt-2.5' : 'bottom-full mb-2.5'
                              } ${
                                wIdx <= 1
                                  ? 'left-0'
                                  : wIdx >= appWeeks.length - 1
                                  ? 'right-0'
                                  : 'left-1/2 -translate-x-1/2'
                              } z-50 flex-col items-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-100`}
                            >
                              {/* Arrow pointing up for top rows */}
                              {cIdx <= 2 && (
                                <div
                                  className={`w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-[#0b0f19]/95 border-t border-l border-slate-700/80 dark:border-white/15 -mb-1 z-10 ${
                                    wIdx <= 1 ? 'self-start ml-2.5' : wIdx >= appWeeks.length - 1 ? 'self-end mr-2.5' : ''
                                  }`}
                                />
                              )}

                              <div className="bg-slate-900/95 dark:bg-[#0b0f19]/95 text-white py-1.5 px-3 rounded-xl shadow-2xl border border-slate-700/80 dark:border-white/15 backdrop-blur-md flex flex-col gap-1 min-w-[130px]">
                                <div className="flex items-center justify-between gap-3 text-[10.5px]">
                                  <span className="font-bold text-slate-300">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(selectedYear, selectedMonth, cell.dayNum).getDay()]}, {shortMonths[selectedMonth]} {cell.dayNum}
                                  </span>
                                  {cell.isToday && (
                                    <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded">
                                      Today
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 pt-0.5 border-t border-white/10">
                                  <span className={`w-2 h-2 rounded-full ${cell.count > 0 ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]' : 'bg-slate-500'} shrink-0`} />
                                  <span className="text-xs font-black text-white">
                                    {cell.count > 0 ? `${cell.count} Application${cell.count === 1 ? '' : 's'}` : 'No applications'}
                                  </span>
                                </div>
                              </div>

                              {/* Arrow pointing down for bottom rows */}
                              {cIdx > 2 && (
                                <div
                                  className={`w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-[#0b0f19]/95 border-b border-r border-slate-700/80 dark:border-white/15 -mt-1 z-10 ${
                                    wIdx <= 1 ? 'self-start ml-2.5' : wIdx >= appWeeks.length - 1 ? 'self-end mr-2.5' : ''
                                  }`}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="w-px bg-slate-200 dark:bg-white/10 shrink-0" />

            {/* Daily Learnings Block */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-[160px]">
              <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <BookOpen size={13} />
                  <span>Daily Learnings</span>
                </span>
                <span
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                    monthLearningsTotal > 0
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {monthLearningsTotal} learnings
                </span>
              </div>

              {/* Grid wrap with days legend (Mon, Wed, Fri) and week columns */}
              <div className="flex gap-2 items-start">
                <div className="grid grid-rows-7 gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 select-none">
                  <div className="h-[18px] flex items-center leading-none">Mon</div>
                  <div className="h-[18px]" />
                  <div className="h-[18px] flex items-center leading-none">Wed</div>
                  <div className="h-[18px]" />
                  <div className="h-[18px] flex items-center leading-none">Fri</div>
                  <div className="h-[18px]" />
                  <div className="h-[18px]" />
                </div>

                <div className="flex gap-1.5 flex-1">
                  {learnWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1.5">
                      {week.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          onMouseEnter={() => {
                            if (cell.dayNum && cell.dateStr) {
                              setHoveredMatrixDay({
                                dateStr: cell.dateStr,
                                dayNum: cell.dayNum,
                                count: cell.count,
                                type: 'learnings',
                                isToday: cell.isToday,
                              });
                            }
                          }}
                          className={`relative group/cell w-[18px] h-[18px] rounded-[5px] border transition-all duration-150 cursor-pointer ${getLearnCellClass(cell)} ${
                            cell.isToday ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-[#141417]' : ''
                          } hover:ring-2 hover:ring-emerald-500/80 hover:scale-110 hover:z-30 hover:shadow-md`}
                        >
                          {/* Modern Floating Popover */}
                          {cell.dayNum && (
                            <div
                              className={`hidden group-hover/cell:flex pointer-events-none absolute ${
                                cIdx <= 2 ? 'top-full mt-2.5' : 'bottom-full mb-2.5'
                              } ${
                                wIdx <= 1
                                  ? 'left-0'
                                  : wIdx >= learnWeeks.length - 1
                                  ? 'right-0'
                                  : 'left-1/2 -translate-x-1/2'
                              } z-50 flex-col items-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-100`}
                            >
                              {/* Arrow pointing up for top rows */}
                              {cIdx <= 2 && (
                                <div
                                  className={`w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-[#0b0f19]/95 border-t border-l border-slate-700/80 dark:border-white/15 -mb-1 z-10 ${
                                    wIdx <= 1 ? 'self-start ml-2.5' : wIdx >= learnWeeks.length - 1 ? 'self-end mr-2.5' : ''
                                  }`}
                                />
                              )}

                              <div className="bg-slate-900/95 dark:bg-[#0b0f19]/95 text-white py-1.5 px-3 rounded-xl shadow-2xl border border-slate-700/80 dark:border-white/15 backdrop-blur-md flex flex-col gap-1 min-w-[130px]">
                                <div className="flex items-center justify-between gap-3 text-[10.5px]">
                                  <span className="font-bold text-slate-300">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(selectedYear, selectedMonth, cell.dayNum).getDay()]}, {shortMonths[selectedMonth]} {cell.dayNum}
                                  </span>
                                  {cell.isToday && (
                                    <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded">
                                      Today
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 pt-0.5 border-t border-white/10">
                                  <span className={`w-2 h-2 rounded-full ${cell.count > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-slate-500'} shrink-0`} />
                                  <span className="text-xs font-black text-white">
                                    {cell.count > 0 ? `${cell.count} Note${cell.count === 1 ? '' : 's'}` : 'No learning notes'}
                                  </span>
                                </div>
                              </div>

                              {/* Arrow pointing down for bottom rows */}
                              {cIdx > 2 && (
                                <div
                                  className={`w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-[#0b0f19]/95 border-b border-r border-slate-700/80 dark:border-white/15 -mt-1 z-10 ${
                                    wIdx <= 1 ? 'self-start ml-2.5' : wIdx >= learnWeeks.length - 1 ? 'self-end mr-2.5' : ''
                                  }`}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Legend & Stats */}
          <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Flame size={12} className="text-orange-500" />
              <span>Active Days:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{monthActiveDays} Days</strong>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-600 shadow-2xs shadow-blue-500/40" /> Apps
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-600 shadow-2xs shadow-emerald-500/40" /> Learnings
              </span>

              {/* Less -> More Scale */}
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[3px] bg-slate-200/70 dark:bg-[#1b2230] border border-slate-300/40 dark:border-white/5" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-200 dark:bg-[#064e3b]" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400 dark:bg-[#059669]" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-600 dark:bg-[#10b981]" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-700 dark:bg-[#34d399]" />
                <span>More</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Stats 2-Column: Job Applications Stats (Left) & Learnings Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Panel 1: Job Applications Stats & Pipeline */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Briefcase size={16} className="text-blue-600" />
                <span>Job Applications Stats &amp; Pipeline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                  {applications.length > 0 ? 'ACTIVE' : '0D'} APP STREAK
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                  {totalApps} TOTAL
                </span>
              </div>
            </div>

            {/* 4 Metric Boxes */}
            <div className="grid grid-cols-4 gap-2.5 mb-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  {totalApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Total Applied
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {interviewingApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Interviewing
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {offerApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Offers
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {responseRate}%
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Response Rate
                </div>
              </div>
            </div>

            {/* Stage Funnel Breakdown Bars */}
            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Stage Funnel Breakdown
              </div>

              {/* Applied */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Applied ({appliedApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${pct(appliedApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(appliedApps)}%
                </span>
              </div>

              {/* Interviewing */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Interviewing ({interviewingApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${pct(interviewingApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(interviewingApps)}%
                </span>
              </div>

              {/* Offers */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Offers ({offerApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${pct(offerApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(offerApps)}%
                </span>
              </div>

              {/* Rejected */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Rejected ({rejectedApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${pct(rejectedApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(rejectedApps)}%
                </span>
              </div>
            </div>
          </div>

          {/* Sub-footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Top Locations: <strong className="text-slate-900 dark:text-white font-bold">{topLocations}</strong></span>
            <span>Archived/Rejected: <strong className="text-slate-900 dark:text-white font-bold">{rejectedApps}</strong></span>
          </div>
        </section>

        {/* Panel 2: Daily Learnings & Mastery Stats */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <BookOpen size={16} className="text-emerald-600" />
                <span>Daily Learnings &amp; Mastery Stats</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                <Flame size={12} className="text-orange-500" />
                <span>{streak}D STREAK</span>
              </span>
            </div>

            {/* 4 Metric Boxes (Real Learning & Study Metrics - No 500XP Gamification) */}
            <div className="grid grid-cols-4 gap-2.5 mb-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                  {streak}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Active Streak
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {studyHours}h
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Study Time
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {totalLearningsCount}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Total Logs
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {uniqueTopicsCount}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Topics Covered
                </div>
              </div>
            </div>

            {/* Dynamic Topic Breakdown (Reflecting user's logged topics) */}
            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Topic Breakdown
                </div>
                {dynamicTopics.length > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {dynamicTopics.length} {dynamicTopics.length === 1 ? 'Topic' : 'Topics'}
                  </span>
                )}
              </div>

              {dynamicTopics.length === 0 ? (
                <div className="py-7 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No Learning Topics Logged Yet
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[280px] m-0 leading-relaxed">
                    Log your daily study sessions in Daily Learnings to see your dynamic topic breakdown here.
                  </p>
                </div>
              ) : (
                <>
                  {dynamicTopics.slice(0, 4).map((topicItem, idx) => {
                    const colorClass = DYNAMIC_TOPIC_COLORS[idx % DYNAMIC_TOPIC_COLORS.length];
                    return (
                      <div key={topicItem.name} className="flex items-center gap-3 text-xs">
                        <span className="w-32 text-slate-700 dark:text-slate-300 font-semibold truncate" title={topicItem.name}>
                          {topicItem.name} ({topicItem.count})
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colorClass} transition-all duration-300`}
                            style={{ width: `${topicItem.pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                          {topicItem.pct}%
                        </span>
                      </div>
                    );
                  })}

                  {dynamicTopics.length > 4 && (
                    <div className="pt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-right">
                      + {dynamicTopics.length - 4} other {dynamicTopics.length - 4 === 1 ? 'topic' : 'topics'}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sub-footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Total Logs: <strong className="text-slate-900 dark:text-white font-bold">{totalLearningsCount} {totalLearningsCount === 1 ? 'Entry' : 'Entries'}</strong></span>
            <span>Topics Covered: <strong className="text-slate-900 dark:text-white font-bold">{uniqueTopicsCount} {uniqueTopicsCount === 1 ? 'Topic' : 'Topics'}</strong></span>
          </div>
        </section>
      </div>

      {/* 5. Career Mastery & Trophy Road Section */}
      <section
        className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-7 shadow-xs space-y-6"
        aria-label="Career Mastery & Trophy Road"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/20 border border-amber-500/30 text-amber-500 shadow-inner">
              <Trophy size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white m-0">
                  Career Mastery & Trophy Road
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  Ranks & Badges
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Level up your job search through daily consistency. Earn XP from applications, focus sessions, and algorithm challenges to ascend the 7 ranks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 font-black text-xs px-3 py-1 rounded-full border shadow-2xs ${currentTierConfig.bg} ${currentTierConfig.border} ${currentTierConfig.text}`}
            >
              <RankIcon size={14} className="shrink-0" />
              <span>Current: Level {userLevel} ({userLevelTitle})</span>
            </span>
          </div>
        </div>

        {/* 7-Tier Trophy Grid Road */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
            const cfg = TROPHY_TIER_CONFIG[lvl];
            const TierIcon = cfg.icon;
            const isUnlocked = lvl <= userLevel;
            const isCurrent = lvl === userLevel;

            return (
              <div
                key={lvl}
                className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  isCurrent
                    ? `${cfg.bg} ${cfg.border} ring-2 ring-indigo-500/40 shadow-md ${cfg.glow} scale-[1.02]`
                    : isUnlocked
                    ? 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    : 'bg-slate-50/40 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/5 opacity-70'
                }`}
              >
                {/* Card Top: Level pill & Status Icon */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isCurrent
                      ? `${cfg.text} bg-white dark:bg-black/40 font-mono`
                      : isUnlocked
                      ? 'text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-white/10 font-mono'
                      : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 font-mono'
                  }`}>
                    L{lvl}
                  </span>

                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                      Current
                    </span>
                  ) : isUnlocked ? (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      <Check size={10} strokeWidth={3} />
                      Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
                      <Lock size={9} />
                      Locked
                    </span>
                  )}
                </div>

                {/* Card Center: Icon & Title */}
                <div className="flex flex-col items-center text-center my-1">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-300 mb-2 ${
                      isCurrent
                        ? `${cfg.bg} ${cfg.border} shadow-md ${cfg.glow} scale-105`
                        : isUnlocked
                        ? `${cfg.bg} ${cfg.border}`
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5'
                    }`}
                  >
                    <Tier3DIcon
                      tier={lvl}
                      size={28}
                      className={isUnlocked ? 'transition-transform duration-300 hover:scale-110 drop-shadow-sm' : 'opacity-35 grayscale'}
                    />
                  </div>

                  <h3 className={`text-xs font-black truncate max-w-full m-0 ${
                    isCurrent ? 'text-slate-900 dark:text-white' : isUnlocked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500'
                  }`}>
                    {cfg.title}
                  </h3>

                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                    {cfg.min.toLocaleString()} {lvl === 7 ? '+ XP' : `– ${cfg.max.toLocaleString()} XP`}
                  </span>
                </div>

                {/* Card Bottom: Description */}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-white/5 line-clamp-3 m-0">
                  {cfg.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Explainer Cards: 1. How to Earn XP & 2. Daily Streak Quest Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card 1: How to Earn XP */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Sparkles size={14} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white m-0">
                How to Earn XP & Level Up
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                <Briefcase size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">+20 XP per Job Application</div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Track and submit roles to companies</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                <Clock size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">+1 XP per 1 Study Minute</div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Log deep focus sprints (45m = +45 XP)</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                <Code2 size={14} className="text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">+25 XP per DSA Problem</div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Solve curated LeetCode challenges</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                <Flame size={14} className="text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">+50 XP per Streak Day</div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Compounding bonus for every streak day</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Daily Streak Quest Rules */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <Flame size={14} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white m-0">
                Daily Streak Quest Requirements
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              To keep your streak alive and add <strong>+1 day</strong>, you must satisfy <strong>both</strong> requirements before midnight in your local timezone:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-[10px]">
                    1
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Apply to at least 1 job role
                  </span>
                </div>
                {(gamification.todayAppCount || 0) >= 1 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} strokeWidth={2.5} /> Done ({gamification.todayAppCount})
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 font-bold text-[10px]">
                    2
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Learn for ≥45 mins OR solve ≥1 DSA problem
                  </span>
                </div>
                {(gamification.todayMinutes || 0) >= 45 || (gamification.todayDsaCount || 0) >= 1 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} strokeWidth={2.5} /> Done
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Pending ({gamification.todayMinutes || 0}/45m)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add / Edit Quick Link Modal (Matching linkModal in profile.html) */}
      {isLinkModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsLinkModalOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141417] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                  {editingLinkId ? 'Edit Quick Link' : 'Add Quick Link'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Portfolio, GitHub, LeetCode"
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                    autoFocus
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    URL / Email *
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or user@example.com"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setIsLinkModalOpen(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>Save Link</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
