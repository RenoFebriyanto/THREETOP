export default function OrdersLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-slate-800/60" />
          <div className="h-4 w-32 rounded-lg bg-slate-800/40" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-800/60" />
      </div>
      {/* Order cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-800/40 p-5" style={{ background: 'rgba(15,20,35,0.6)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded-lg bg-slate-800/60" />
              <div className="h-3 w-24 rounded-lg bg-slate-800/40" />
              <div className="h-3 w-20 rounded-lg bg-slate-800/30" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 w-20 rounded-lg bg-slate-800/60" />
              <div className="h-6 w-16 rounded-full bg-slate-800/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
