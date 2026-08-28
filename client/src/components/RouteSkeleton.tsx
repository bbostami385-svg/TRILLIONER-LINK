import { Skeleton } from "@/components/ui/skeleton";

export default function RouteSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading TRILLIONER LINK page"
      className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10"
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-64 max-w-[70vw]" />
            <Skeleton className="h-4 w-80 max-w-[85vw]" />
          </div>
          <Skeleton className="hidden h-10 w-28 sm:block" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm">
              <Skeleton className="aspect-[16/9] w-full rounded-xl" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
