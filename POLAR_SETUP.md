# Polar.sh Setup Guide

Chatterbox uses [Polar.sh](https://polar.sh) for subscription billing (Pro & Enterprise plans).

## Prerequisites

- A Polar.sh account
- Your Polar.sh organization created
- A connected Stripe account for payouts

## 1. Create a Polar.sh Account

1. Go to [polar.sh](https://polar.sh) and sign up (GitHub or email)
2. Create an organization for your Chatterbox instance
3. Complete onboarding and verify your email

## 2. Get Your API Keys

1. In Polar.sh, go to **Settings → Developers**
2. Click "Create API Key"
3. Name it `chatterbox-production`
4. Copy the key immediately — you won't see it again

Add to `.env.local`:

```env
POLAR_ACCESS_TOKEN=polar_sk_live_xxxxxxxxxxxxxxxxxxxx
POLAR_ORGANIZATION_ID=your-org-id
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

## 3. Create Subscription Products

1. In Polar.sh, go to **Products**
2. Create a product called **Chatterbox Pro**
   - Price: $8/member/month
   - Recurring billing
3. Optionally create **Chatterbox Enterprise** (custom pricing)
4. Note the product IDs

Add to `.env.local`:

```env
POLAR_PRO_PRODUCT_ID=prod_xxxxxxxxxxxxxxxxxxxx
POLAR_ENTERPRISE_PRODUCT_ID=prod_xxxxxxxxxxxxxxxxxxxx
```

## 4. Set Up Webhooks

1. In Polar.sh, go to **Settings → Webhooks**
2. Add endpoint: `https://your-domain.com/api/webhooks/polar`
3. Subscribe to these events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `order.created`
4. Copy the webhook signing secret into `POLAR_WEBHOOK_SECRET`

## 5. Install the SDK

```bash
npm install @polar-sh/sdk
```

## 6. Code Already in Place

The following files handle the Polar integration:

- `src/lib/polar.ts` — Polar client initialization
- `src/app/api/checkout/route.ts` — Creates checkout sessions, redirects to Polar hosted checkout
- `src/app/api/webhooks/polar/route.ts` — Receives webhook events, updates box plan in Supabase
- `src/app/(app)/checkout/` — Checkout UI (redirects to Polar, handles success callback)

## 7. Testing

1. Use **test mode** API keys from Polar.sh dashboard
2. Set test keys in `.env.local`
3. Create a test subscription through the checkout flow
4. Verify the webhook fires and updates the box plan
5. Test cancellation and downgrade
6. Switch to live keys when ready

```env
# Test environment
POLAR_ACCESS_TOKEN=polar_sk_test_xxxxxxxxxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxxxxxxxxx
```

Test mode won't charge real payment methods.

## Environment Variables Summary

| Variable | Description |
|---|---|
| `POLAR_ACCESS_TOKEN` | Polar.sh API secret key |
| `POLAR_ORGANIZATION_ID` | Your Polar.sh org ID |
| `POLAR_WEBHOOK_SECRET` | Webhook signing secret |
| `POLAR_PRO_PRODUCT_ID` | Product ID for Pro plan |
| `POLAR_ENTERPRISE_PRODUCT_ID` | Product ID for Enterprise plan |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL (for success redirects) |
