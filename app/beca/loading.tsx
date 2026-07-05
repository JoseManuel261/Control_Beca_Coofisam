export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-16 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="border-b border-zinc-900 pb-10 space-y-4">
          <div className="h-9 w-96 bg-zinc-900 rounded-lg" />
          <div className="h-4 w-full max-w-xl bg-zinc-900/60 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 rounded-2xl border border-zinc-900 bg-zinc-900/20" />
          <div className="h-28 rounded-2xl border border-zinc-900 bg-zinc-900/20" />
          <div className="h-28 rounded-2xl border border-zinc-900 bg-zinc-900/20" />
        </div>
        <div className="h-64 rounded-2xl border border-zinc-900 bg-zinc-900/20" />
      </div>
    </div>
  );
}
