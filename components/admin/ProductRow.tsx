import React from 'react'

type Product = {
  buyer_sku_code: string
  product_name: string
  price: number
  sell_price?: number
  unlimited_stock: boolean
  stock?: number
  buyer_product_status?: boolean
}

export default function ProductRow({ product }: { product: Product }) {
  const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.sell_price ?? product.price)

  return (
    <div className="flex items-center px-4 py-2.5 hover:bg-[var(--color-abyss)]/20 transition-colors">
      <div className="w-40 font-mono text-[var(--color-muted)] text-xs truncate">{product.buyer_sku_code}</div>
      <div className="flex-1 min-w-0 text-white text-xs truncate">{product.product_name}</div>
      <div className="w-28 text-right text-[var(--color-frost)] font-semibold text-xs whitespace-nowrap">{price}</div>
      <div className="w-20 text-[var(--color-muted)] text-xs text-center">{product.unlimited_stock ? '∞' : product.stock}</div>
      <div className="w-28 pl-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
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
