'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type Props = {
  image: string | string[]
  fallback: string
  fallbackImage?: string
  label: string
  size?: number
  className?: string
}

export default function GameIcon({ image, fallbackImage, fallback, label, size = 40, className = '' }: Props) {
  const [srcList, setSrcList] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    const candidates = Array.isArray(image) ? image : [image]
    setSrcList(candidates)
    setIndex(0)
    setErrored(false)
  }, [image])

  useEffect(() => {
    if (fallbackImage && typeof fallbackImage === 'string' && !srcList.includes(fallbackImage)) {
      setSrcList((prev) => [...prev, fallbackImage])
    }
  }, [fallbackImage, srcList])

  function handleError() {
    if (index < srcList.length - 1) {
      setIndex((prev) => prev + 1)
      return
    }
    setErrored(true)
  }

  if (errored || srcList.length === 0) {
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
      src={srcList[index]}
      alt={label}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={handleError}
    />
  )
}
