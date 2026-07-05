export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-16 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-14">
        <div className="border-b border-zinc-900 pb-8 space-y-4">
          <div className="h-9 w-72 bg-zinc-900 rounded-lg" />
          <div className="h-4 w-96 bg-zinc-900/60 rounded-lg" />
          <div className="h-8 w-48 bg-zinc-900 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-40 bg-zinc-900 rounded-lg" />
          <div className="h-40 rounded-2xl border border-zinc-900 bg-zinc-900/20" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-40 bg-zinc-900 rounded-lg" />
          <div className="h-32 rounded-2xl border border-zinc-900 bg-zinc-900/20" />
        </div>
      </div>
    </div>
  );
}
