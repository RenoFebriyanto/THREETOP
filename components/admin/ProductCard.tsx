import React from 'react'

type Product = {
  buyer_sku_code: string
  product_name: string
  price: number
  unlimited_stock: boolean
  stock?: number
  buyer_product_status?: boolean
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-dark)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{product.product_name}</p>
          <p className="text-[var(--color-muted)] text-xs mt-1 truncate">{product.buyer_sku_code}</p>
        </div>
        <span className="text-[var(--color-frost)] font-semibold text-sm whitespace-nowrap">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)] mt-3">
        <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-1">{product.unlimited_stock ? 'Stok: ∞' : `Stok: ${product.stock}`}</span>
        <span className={`rounded-full px-2 py-1 border text-xs font-medium ${
          product.buyer_product_status
            ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]'
            : 'bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error)]'
        }`}>
          {product.buyer_product_status ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
    </div>
  )
}
