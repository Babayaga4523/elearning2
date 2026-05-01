import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "../../../../components/ui/skeleton";

export const SkeletonDashboard = () => {
  return (
    <div className="space-y-10 p-6 md:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Hero Skeleton */}
      <Skeleton className="h-[220px] w-full rounded-3xl bg-slate-200" />
      
      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl bg-slate-200" />
        ))}
      </div>

      {/* Courses Grid Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-32 rounded-full bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[380px] rounded-2xl bg-slate-100 border-none overflow-hidden">
               <Skeleton className="h-40 w-full bg-slate-200" />
               <div className="p-6 space-y-3">
                  <Skeleton className="h-5 w-3/4 bg-slate-200" />
                  <Skeleton className="h-3 w-1/2 bg-slate-200" />
                  <div className="pt-12 space-y-2">
                     <Skeleton className="h-1.5 w-full bg-slate-200" />
                     <Skeleton className="h-8 w-full bg-slate-200" />
                  </div>
               </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
