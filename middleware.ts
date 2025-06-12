import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook-test(.*)',
])

const isWebhookRoute = createRouteMatcher([
  '/api/mux',
])

export default clerkMiddleware(async (auth, req) => {
  // Allow POST requests to webhook routes without authentication (for Mux webhooks)
  // But we need to check the request body to distinguish between webhooks and upload success
  if (isWebhookRoute(req) && req.method === 'POST') {
    // For now, let all POST requests through and handle auth in the route handler
    return
  }
  
  // Protect all other routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}