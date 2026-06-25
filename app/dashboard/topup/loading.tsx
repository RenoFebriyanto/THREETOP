export default function TopUpLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Carousel skeleton */}
      <div className="rounded-xl bg-[#111827]/60" style={{ aspectRatio: '21/7' }} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-xl bg-[#111827]/60" />
          <div className="h-4 w-48 rounded-lg bg-[#111827]/40" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-[#111827]/60" />
      </div>
      {/* Game grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#111827]/60" style={{ height: '140px' }} />
        ))}
      </div>
    </div>
  )
}
