// This file exists to document why all pages use force-dynamic.
// Clerk's publishable key is decoded via atob() at import time,
// which crashes Next.js static generation on Railway where
// NEXT_PUBLIC_* vars are not available during build.
export const dynamic = 'force-dynamic'
