/** عناصر هيكل عظمي (Skeleton) للتحميل — نبض + وميض ناعم. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

/** بطاقة إحصائية هيكلية */
export function StatSkeleton() {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="size-11 rounded-2xl" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

/** بطاقة محتوى هيكلية */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${["w-11/12", "w-4/5", "w-2/3", "w-3/4"][i % 4]}`} />
        ))}
      </div>
    </div>
  );
}

/** رأس صفحة هيكلي */
export function HeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

/** شبكة بطاقات هيكلية */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
