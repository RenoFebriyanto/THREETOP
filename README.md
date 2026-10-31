This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Duitku Payments

Configure these server-side environment variables in `.env.local` and in the deployment environment:

```env
DUITKU_MERCHANT_CODE=
DUITKU_API_KEY=
DUITKU_IS_PRODUCTION=false
AUTH_URL=https://threetop.my.id
```

Use the sandbox merchant code and API key with `DUITKU_IS_PRODUCTION=false`. After Duitku approves the project, replace them with the production credentials and set `DUITKU_IS_PRODUCTION=true`. Do not expose the API key with a `NEXT_PUBLIC_` prefix.

Set the Duitku project callback URL to `https://threetop.my.id/api/payment/webhook`. The application also sends this callback URL with each payment request. Duitku returns customers to the matching game top-up page after checkout.

## Digiflazz Auto Balance Monitor

The admin dashboard stores the latest Digiflazz balance and shows warning/critical states. Checks can run every five minutes through an external scheduler; Telegram alerts are sent when the balance crosses a threshold and when it recovers. The dashboard also lets an admin request a Digiflazz deposit ticket. Ticket creation does not transfer money; follow the returned payment instructions manually.

1. Run the SQL in `prisma/migrations/20261031_add_digiflazz_balance_monitor/migration.sql` in the Supabase SQL Editor.
2. Set these server-side environment variables in Vercel. The example values start at a Rp200,000 warning threshold, Rp100,000 critical threshold, and Rp200,000 ticket amount. Change them as needed; changing Vercel environment variables requires a redeployment.
   - `DIGIFLAZZ_BALANCE_WARNING_THRESHOLD`
   - `DIGIFLAZZ_BALANCE_CRITICAL_THRESHOLD`
   - `DIGIFLAZZ_DEPOSIT_TARGET_AMOUNT`
   - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
   - `CRON_SECRET` — use a long, random value; never expose it in browser code.
3. Configure an external scheduler such as cron-job.org to send a `GET` request every five minutes to `https://threetop.my.id/api/cron/digiflazz-balance` with the header `Authorization: Bearer <CRON_SECRET>`.
4. Open the admin dashboard and use **Cek saldo sekarang** to verify connectivity. Use **Minta tiket deposit ShopeePay** when you are ready to request payment instructions.

The scheduled endpoint requires the exact `CRON_SECRET` header and returns `401` if it is missing or incorrect. A failed Digiflazz or Telegram request is logged and returned as an error so the scheduler can retry.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
