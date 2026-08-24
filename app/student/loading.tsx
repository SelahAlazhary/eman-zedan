import { Skeleton, CardGridSkeleton } from "@/components/ui/skeleton";

export default function StudentLoading() {
  return (
    <>
      <Skeleton className="mb-6 h-28 rounded-3xl sm:h-32" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-20 rounded-3xl" />
      </div>
      <Skeleton className="mb-3 h-6 w-40" />
      <CardGridSkeleton count={4} />
    </>
  );
}
