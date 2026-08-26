import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intl = createIntlMiddleware(routing);

// Public marketplace surface: locale-routed, no auth required (ADR 0011).
const PUBLIC_LOCALIZED = [
  /^\/$/,
  /^\/(en|ar)(\/.*)?$/,
  /^\/search(\/.*)?$/,
  /^\/sell$/,
  /^\/trade-in$/,
  /^\/providers(\/.*)?$/,
  /^\/m\/.+$/, // catalog item pages
  /^\/checkout\/.+$/,
  /^\/s\/.+$/, // storefronts (deep paths 404 inside the locale tree, not at /login)
  /^\/p\/.+$/, // product pages
];

// Public but outside the locale tree (legal pages live at the root)
const PUBLIC_PLAIN = [
  /^\/offline$/,
  /^\/sw\.js$/,
  /^\/manifest\.webmanifest$/,
  /^\/sitemap\.xml$/,
  /^\/robots\.txt$/,
  /^\/icons\/.+$/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/api\/trade-in\/evaluate$/, // guests get valuations; validates its own input
  /^\/api\/admin\/ingest$/, // guarded by INGEST_SECRET header, not a session
  /^\/api\/catalog\/request$/, // guest interest capture; validates input
  /^\/api\/checkout$/, // guest checkout; validates input
  /^\/api\/assistant$/, // public shopping assistant
  /^\/api\/providers\/request$/, // guest shop requests; validates input
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (PUBLIC_LOCALIZED.some((re) => re.test(path))) {
    return intl(request);
  }
  if (PUBLIC_PLAIN.some((re) => re.test(path))) {
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
