import React from 'react';
import { STAGES } from '../../utils/constants';

/**
 * Single shimmering application card skeleton
 * Mirrors the exact geometry and visual hierarchy of ApplicationCard
 */
export const SkeletonCard: React.FC = () => {
  return (
    <div className="relative rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#18181b]/70 p-3.5 shadow-2xs overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-slate-200/40 dark:via-white/5 to-transparent" />

      <div className="space-y-3">
        {/* Top: Logo + Company name + Category pill */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-200/90 dark:bg-white/10 shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 w-3/4 rounded-md bg-slate-200/90 dark:bg-white/10 animate-pulse" />
            <div className="h-2.5 w-2/5 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          </div>
          <div className="w-12 h-4 rounded-md bg-slate-200/60 dark:bg-white/5 shrink-0 animate-pulse" />
        </div>

        {/* Middle: Role title & Location */}
        <div className="space-y-1.5 pt-0.5">
          <div className="h-3 w-4/5 rounded bg-slate-200/80 dark:bg-white/10 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
        </div>

        {/* Bottom footer: Stage pill + Date badge */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/5">
          <div className="h-3.5 w-16 rounded-full bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          <div className="h-3.5 w-14 rounded-full bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * Column of skeleton cards for Kanban lane loading
 */
export const SkeletonColumn: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

/**
 * 5-column Kanban Board skeleton loader
 */
export const SkeletonBoard: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch overflow-hidden">
      {STAGES.map(stage => (
        <div
          key={stage}
          className="flex flex-col min-w-0 bg-slate-100/70 dark:bg-[#121215] border border-slate-200/90 dark:border-white/10 rounded-2xl p-2.5 h-full min-h-0"
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 shadow-2xs mb-2.5">
            <div className="h-3.5 w-24 rounded bg-slate-200/90 dark:bg-white/10 animate-pulse" />
            <div className="h-4 w-6 rounded-full bg-slate-200/70 dark:bg-white/10 animate-pulse" />
          </div>
          {/* Skeleton Cards */}
          <SkeletonColumn count={2} />
        </div>
      ))}
    </div>
  );
};

/**
 * Single learning note card skeleton
 */
export const SkeletonLearningCard: React.FC = () => {
  return (
    <div className="relative rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#18181b]/70 p-3.5 shadow-2xs overflow-hidden space-y-3">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-slate-200/40 dark:via-white/5 to-transparent" />

      <div className="flex items-center justify-between">
        <div className="h-3.5 w-1/3 rounded-md bg-slate-200/90 dark:bg-white/10 animate-pulse" />
        <div className="h-4 w-14 rounded-full bg-slate-200/70 dark:bg-white/5 animate-pulse" />
      </div>

      <div className="space-y-1.5">
        <div className="h-4 w-4/5 rounded bg-slate-200/90 dark:bg-white/10 animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
        <div className="h-3.5 w-12 rounded-md bg-slate-200/60 dark:bg-white/5 animate-pulse" />
        <div className="h-3.5 w-16 rounded-md bg-slate-200/60 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Full Learnings Board skeleton loader
 */
export const SkeletonLearningsBoard: React.FC = () => {
  return (
    <div className="flex-1 w-full flex flex-col gap-4 overflow-hidden animate-pulse">
      {/* Top Focus Bar Skeleton */}
      <div className="w-full h-14 rounded-2xl bg-slate-200/70 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10" />

      {/* Filter Row Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 rounded-lg bg-slate-200/70 dark:bg-white/[0.04]" />
          <div className="w-20 h-8 rounded-lg bg-slate-200/70 dark:bg-white/[0.04]" />
          <div className="w-20 h-8 rounded-lg bg-slate-200/70 dark:bg-white/[0.04]" />
        </div>
        <div className="w-28 h-8 rounded-lg bg-slate-200/70 dark:bg-white/[0.04]" />
      </div>

      {/* Track Lanes Skeleton */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl bg-slate-100/70 dark:bg-[#121215] border border-slate-200/90 dark:border-white/10 p-3 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
              <div className="h-4 w-24 rounded bg-slate-200/80 dark:bg-white/10" />
              <div className="h-4 w-6 rounded-full bg-slate-200/60 dark:bg-white/5" />
            </div>
            <SkeletonLearningCard />
            <SkeletonLearningCard />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full DSA Practice page skeleton loader
 */
export const SkeletonDsaPage: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse pb-16">
      {/* Header Banner Skeleton */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#141417] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-lg bg-slate-200/80 dark:bg-white/10" />
            <div className="h-4 w-72 rounded bg-slate-200/50 dark:bg-white/5" />
          </div>
          <div className="flex gap-2">
            <div className="w-24 h-10 rounded-xl bg-slate-200/80 dark:bg-white/10" />
            <div className="w-24 h-10 rounded-xl bg-slate-200/80 dark:bg-white/10" />
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200/60 dark:bg-white/5" />
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-48 h-9 rounded-xl bg-slate-200/70 dark:bg-white/5" />
        <div className="w-32 h-9 rounded-xl bg-slate-200/70 dark:bg-white/5" />
      </div>

      {/* Categories Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#141417] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-200/80 dark:bg-white/10" />
                <div className="h-4 w-32 rounded bg-slate-200/80 dark:bg-white/10" />
              </div>
              <div className="h-4 w-12 rounded-full bg-slate-200/60 dark:bg-white/5" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200/50 dark:bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full Career Profile page skeleton loader
 */
export const SkeletonProfilePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 w-full animate-pulse">
      {/* 2 Top Hero Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Hero Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#141417] p-6 flex flex-col justify-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200/80 dark:bg-white/10 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-36 rounded bg-slate-200/80 dark:bg-white/10" />
              <div className="h-3.5 w-48 rounded bg-slate-200/50 dark:bg-white/5" />
            </div>
          </div>
          {/* 2 Side-by-Side 3D Subsections Skeleton */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="h-24 rounded-2xl bg-slate-200/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/5" />
            <div className="h-24 rounded-2xl bg-slate-200/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/5" />
          </div>
          {/* Level Progress Bar Skeleton */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-slate-200/60 dark:bg-white/5" />
              <div className="h-3 w-24 rounded bg-slate-200/60 dark:bg-white/5" />
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200/60 dark:bg-white/5" />
          </div>
        </div>

        {/* Right Hero Card: Storage Engine */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#141417] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200/80 dark:bg-white/10" />
            <div className="h-10 w-full rounded-xl bg-slate-200/60 dark:bg-white/5" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-xl bg-slate-200/60 dark:bg-white/5" />
            <div className="h-9 flex-1 rounded-xl bg-slate-200/60 dark:bg-white/5" />
          </div>
          <div className="h-14 w-full rounded-xl bg-slate-200/50 dark:bg-white/5" />
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="h-64 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#141417] p-6" />
        <div className="h-64 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#141417] p-6" />
      </div>

      {/* Bottom Trophy Road Skeleton */}
      <div className="h-56 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#141417] p-6" />
    </div>
  );
};
