import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If user is on the root page and authenticated, redirect to dashboard
  if (req.nextUrl.pathname === '/' && userId) {
    return NextResponse.redirect(new URL('/dashboard/assignments', req.url));
  }

  // If user is on the root page and NOT authenticated, redirect to sign-in
  if (req.nextUrl.pathname === '/' && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // If user is on sign-in/sign-up but already authenticated, redirect to dashboard
  if ((req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up')) && userId) {
    return NextResponse.redirect(new URL('/dashboard/assignments', req.url));
  }

  // Protect dashboard routes
  if (isProtectedRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
