import Script from 'next/script'

const SNAP_URL = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'

export default function TopUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src={SNAP_URL}
        data-client-key={process.env.MIDTRANS_CLIENT_KEY ?? ''}
        strategy="lazyOnload"
      />
      {children}
    </>
  )
}