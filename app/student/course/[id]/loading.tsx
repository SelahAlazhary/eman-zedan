import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <>
      <Skeleton className="mb-4 h-4 w-28" />
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Skeleton className="aspect-video rounded-3xl" />
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
        </div>
        <div className="glass rounded-3xl p-4">
          <Skeleton className="mb-4 h-5 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-2xl" />)}
          </div>
        </div>
      </div>
    </>
  );
}
