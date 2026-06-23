import { getProducts, groupProductsByGame, SUPPORTED_GAMES, IS_STAGING } from '@/lib/digiflazz'
import GameIcon from '@/components/ui/GameIcon'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let fetchError = ''

  try {
    products = await getProducts()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Gagal memuat produk'
  }

  const grouped = groupProductsByGame(products)
  const totalActive = products.filter((p) => p.buyer_product_status && p.seller_product_status).length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daftar Produk</h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalActive} produk aktif dari {products.length} total
            {IS_STAGING && <span className="ml-2 text-amber-400 text-xs">(Staging Mode)</span>}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
          IS_STAGING
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {IS_STAGING ? '🧪 Staging' : '🟢 Production'}
        </div>
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-red-500/20 p-4 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {fetchError}
        </div>
      )}

      {Object.entries(SUPPORTED_GAMES).map(([gameKey, gameInfo]) => {
        const gameProducts = grouped[gameKey] ?? []
        return (
          <div key={gameKey} className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'rgba(15,20,35,0.8)' }}>
            {/* Game header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
                <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={36} />
              </div>
              <div>
                <h2 className="text-white font-semibold">{gameInfo.label}</h2>
                <p className="text-slate-500 text-xs">{gameProducts.length} produk tersedia · {gameInfo.tag}</p>
              </div>
              {gameProducts.length === 0 && (
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                  Tidak tersedia
                </span>
              )}
            </div>

            {gameProducts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/40">
                      {['SKU', 'Nama Produk', 'Harga', 'Stok', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-slate-600 text-xs font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {gameProducts.map((p) => (
                      <tr key={p.buyer_sku_code} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-slate-400 text-xs">{p.buyer_sku_code}</td>
                        <td className="px-4 py-2.5 text-white text-xs">{p.product_name}</td>
                        <td className="px-4 py-2.5 text-sky-400 font-semibold text-xs whitespace-nowrap">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">
                          {p.unlimited_stock ? '∞' : p.stock}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                            p.buyer_product_status
                              ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                              : 'bg-red-400/10 border-red-400/20 text-red-400'
                          }`}>
                            {p.buyer_product_status ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
