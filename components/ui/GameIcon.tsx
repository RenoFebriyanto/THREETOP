'use client'

import Image from 'next/image'
import { useState } from 'react'

type Props = {
  image: string     // path PNG, e.g. /icons/games/mobile-legends.png
  fallback: string  // emoji fallback
  label: string     // alt text
  size?: number     // px, default 40
  className?: string
}

export default function GameIcon({ image, fallback, label, size = 40, className = '' }: Props) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <span
        className={`flex items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-muted)] font-bold rounded-lg ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.28) }}
      >
        {fallback}
      </span>
    )
  }

  return (
    <Image
      src={image}
      alt={label}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={() => setError(true)}
    />
  )
}
