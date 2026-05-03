import { Skeleton } from "@/components/ui/Skeleton";

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-[#e7e5e4] bg-white p-4"
        >
          <Skeleton variant="circle" className="h-12 w-12 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton variant="text" className="h-5 w-48" />
            <Skeleton variant="text" className="h-4 w-32" />
          </div>
          <Skeleton variant="text" className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#e7e5e4] bg-white p-6"
        >
          <Skeleton variant="text" className="mb-3 h-5 w-24" />
          <Skeleton variant="text" className="mb-2 h-8 w-16" />
          <Skeleton variant="text" className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-xl border border-[#e7e5e4] bg-white p-5"
        >
          <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton variant="text" className="h-5 w-56" />
            <div className="flex gap-2">
              <Skeleton variant="text" className="h-5 w-16 rounded-full" />
              <Skeleton variant="text" className="h-5 w-20 rounded-full" />
              <Skeleton variant="text" className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton variant="text" className="h-4 w-40" />
          </div>
          <Skeleton variant="text" className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export { SearchSkeleton, DashboardSkeleton, AlertsSkeleton };
