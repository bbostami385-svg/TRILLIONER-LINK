export default function RouteSkeleton() {
  return (
    <main className="min-h-[60vh] bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10" aria-label="Loading page">
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-xl rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-36 rounded-2xl border border-border bg-card" />)}
        </div>
        <div className="h-64 rounded-2xl border border-border bg-card" />
      </div>
    </main>
  );
}
