import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rediriger / vers /eu
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/eu', request.url))
  }

  // Pages publiques sans préfixe de langue → rediriger vers /eu/
  if (
    ['/inscription', '/poules', '/programme', '/resultats'].includes(pathname)
  ) {
    return NextResponse.redirect(new URL(`/eu${pathname}`, request.url))
  }

  // Admin : ne pas toucher à /admin/login
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Admin : protéger toutes les routes /admin/*
  if (pathname.startsWith('/admin')) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/inscription', '/poules', '/programme', '/resultats', '/admin/:path*'],
}
