import '@/lib/normalize-clerk-env'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/realtime-config',
  '/api/rtc-config',
  '/api/webhooks(.*)',
  '/teacher/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname
  const isRuntimeConfigRoute =
    pathname === '/api/realtime-config' ||
    pathname === '/api/rtc-config'

  if (!isRuntimeConfigRoute && !isPublicRoute(req)) {
    await auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}

