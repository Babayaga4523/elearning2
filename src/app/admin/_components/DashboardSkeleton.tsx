"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded",
        className
      )}
      style={style}
    />
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20 rounded" />
      <Skeleton className="h-3 w-24 rounded" />
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="h-[200px] flex items-end justify-center gap-2 p-4">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton key={i} className={cn("w-8 rounded-t-lg")} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

// Activity Item Skeleton
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-2.5 w-32 rounded" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-2.5 w-20 rounded" />
      </div>
    </div>
  );
}

// Quick Action Skeleton
export function QuickActionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-2.5 w-20 rounded" />
      </div>
      <Skeleton className="h-4 w-4 rounded" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Full Dashboard Loading Skeleton
// ─────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="w-full min-w-0 space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Row 2: Enrollment + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
            <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
            <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
            <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
          </div>
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>
          </div>
          <div className="h-[200px] flex items-end justify-center gap-2 p-4">
            {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
              <Skeleton key={i} className="w-8 rounded-t-lg" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="flex items-center justify-center py-4">
            <Skeleton className="h-40 w-40 rounded-full" style={{ borderRadius: "50%" }} />
          </div>
        </div>
      </div>

      {/* Row 4: Activity + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden p-5 space-y-4">
          <Skeleton className="h-4 w-40 rounded" />
          <ActivityItemSkeleton />
          <ActivityItemSkeleton />
          <ActivityItemSkeleton />
          <ActivityItemSkeleton />
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-10 w-16 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 h-28" />
        </div>
      </div>
    </div>
  );
}