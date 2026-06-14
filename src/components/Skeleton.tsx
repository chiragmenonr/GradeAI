function ShimmerBox({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-white/8 ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
            <ShimmerBox className="mb-2 h-3 w-24" />
            <ShimmerBox className="h-8 w-32" />
            <ShimmerBox className="mt-1 h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
        <ShimmerBox className="mb-4 h-4 w-32" />
        <ShimmerBox className="h-48 w-full" />
      </div>

      {/* What You Need */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
            <ShimmerBox className="mx-auto mb-2 h-4 w-16" />
            <ShimmerBox className="mx-auto h-8 w-20" />
            <ShimmerBox className="mx-auto mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* AI insight */}
      <div className="rounded-xl border border-purple-500/20 bg-white dark:bg-white/5 p-5">
        <ShimmerBox className="mb-3 h-4 w-28" />
        <ShimmerBox className="mb-2 h-3 w-full" />
        <ShimmerBox className="mb-2 h-3 w-5/6" />
        <ShimmerBox className="h-3 w-4/6" />
      </div>
    </div>
  );
}
