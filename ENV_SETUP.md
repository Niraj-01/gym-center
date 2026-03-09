# Environment Variables Setup

Add these variables to your `.env.local` file:

```env
# Existing Supabase Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# UPI Payment Details (NEW - REQUIRED FOR MEMBER PORTAL)
NEXT_PUBLIC_GYM_UPI_ID=yourname@paytm
NEXT_PUBLIC_GYM_NAME="GymCentre"

# App URL (NEW - REQUIRED FOR QR CODE)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production deployment, change to: https://your-app.vercel.app
```

## UPI ID Setup Instructions

1. Get your gym's UPI ID from any UPI app (PhonePe, GooglePay, Paytm, etc.)
2. Format: `yourname@provider` (e.g., john@paytm, gym@phonepe)
3. Add to `NEXT_PUBLIC_GYM_UPI_ID`
4. Set `NEXT_PUBLIC_GYM_NAME` to your gym's name (will appear in UPI payment screen)

## App URL Configuration

- **Development**: `http://localhost:3000`
- **Production**: Your deployed Vercel URL (e.g., `https://gym-centre.vercel.app`)

The QR code will use this URL to redirect members to the login page.
