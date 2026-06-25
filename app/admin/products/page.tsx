import { getProducts, groupProductsByGame, SUPPORTED_GAMES } from '@/lib/digiflazz'
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
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {totalActive} produk aktif dari {products.length} total
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-medium border bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]">
          Production
        </div>
      </div>

      {fetchError && (
        <div className="rounded-lg border border-[var(--color-error-border)] p-4 bg-[var(--color-error-bg)] flex items-center gap-3 text-[var(--color-error)] text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {fetchError}
        </div>
      )}

      {Object.entries(SUPPORTED_GAMES).map(([gameKey, gameInfo]) => {
        const gameProducts = grouped[gameKey] ?? []
        return (
          <div key={gameKey} className="rounded-lg border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-surface-dark)' }}>
            {/* Game header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--color-abyss)] shrink-0 flex items-center justify-center">
                <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={36} />
              </div>
              <div>
                <h2 className="text-white font-semibold">{gameInfo.label}</h2>
                <p className="text-[var(--color-muted-strong)] text-xs">{gameProducts.length} produk tersedia · {gameInfo.tag}</p>
              </div>
              {gameProducts.length === 0 && (
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)]">
                  Tidak tersedia
                </span>
              )}
            </div>

            {gameProducts.length > 0 && (
              <>
                <div className="sm:hidden space-y-3 px-4 py-4">
                  {gameProducts.map((p) => (
                    <div key={p.buyer_sku_code} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-dark)] p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{p.product_name}</p>
                          <p className="text-[var(--color-muted)] text-xs mt-1 truncate">{p.buyer_sku_code}</p>
                        </div>
                        <span className="text-[var(--color-frost)] font-semibold text-sm whitespace-nowrap">{formatCurrency(p.price)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                        <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-1">{p.unlimited_stock ? 'Stok: ∞' : `Stok: ${p.stock}`}</span>
                        <span className={`rounded-full px-2 py-1 border text-xs font-medium ${
                          p.buyer_product_status
                            ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]'
                            : 'bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error)]'
                        }`}>
                          {p.buyer_product_status ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        {['SKU', 'Nama Produk', 'Harga', 'Stok', 'Status'].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-[var(--color-muted-strong)] text-xs font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {gameProducts.map((p) => (
                        <tr key={p.buyer_sku_code} className="hover:bg-[var(--color-abyss)]/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-[var(--color-muted)] text-xs">{p.buyer_sku_code}</td>
                          <td className="px-4 py-2.5 text-white text-xs">{p.product_name}</td>
                          <td className="px-4 py-2.5 text-[var(--color-frost)] font-semibold text-xs whitespace-nowrap">{formatCurrency(p.price)}</td>
                          <td className="px-4 py-2.5 text-[var(--color-muted)] text-xs">{p.unlimited_stock ? '∞' : p.stock}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                              p.buyer_product_status
                                ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]'
                                : 'bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error)]'
                            }`}>
                              {p.buyer_product_status ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
