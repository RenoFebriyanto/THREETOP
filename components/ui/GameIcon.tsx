'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type Props = {
  image: string | string[]
  fallback: string
  fallbackImage?: string
  label: string
  size?: number
  className?: string
}

export default function GameIcon({ image, fallbackImage, fallback, label, size = 40, className = '' }: Props) {
  const srcList = useMemo(() => {
    const candidates = Array.isArray(image) ? image : [image]
    return fallbackImage && !candidates.includes(fallbackImage)
      ? [...candidates, fallbackImage]
      : candidates
  }, [image, fallbackImage])
  const [failedSources, setFailedSources] = useState<Set<string>>(() => new Set())
  const src = srcList.find((candidate) => !failedSources.has(candidate))

  if (!src) {
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
      src={src}
      alt={label}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`object-contain ${className}`}
      onError={() => setFailedSources((previous) => new Set(previous).add(src))}
    />
  )
}
