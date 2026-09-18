import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-svh bg-background">
      <div className="bg-[#111111] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3">
          <Skeleton className="size-16 rounded-full bg-white/10" />
          <Skeleton className="h-7 w-48 bg-white/10" />
          <Skeleton className="h-4 w-32 bg-white/10" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
