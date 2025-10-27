import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth/session'
import { cookies } from 'next/headers'

// 1. Specify protected and public routes
const protectedRoutes = ['/admin']
// const adminRoutes = ['/admin']
const authRoutes = ['/auth/sign-in', '/auth/sign-up']

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
  // const isAdminRoute = adminRoutes.some((route) => path.startsWith(route))
  const isPublicRoute = authRoutes.includes(path)

  //3. Decrypt the session from the cookie
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  //4. Redirect to /auth/sign-in if the user is not authenticated and trying to access protected routes
  if (isProtectedRoute && !session?.access_token) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.nextUrl))
  }

  // 5. Role-based access control for authenticated users
  if (session?.access_token) {
    const userRole = session.role

    // Check if admin is trying to access education admin routes
    // if (userRole === 'admin' && (isEducationAdminRoute || isStudentRoute)) {
    //   return NextResponse.redirect(new URL('/admin', req.nextUrl))
    // }

    // 6. Redirect authenticated users from public routes to their respective dashboards
    if (isPublicRoute) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.nextUrl))
      }
    }
  }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
