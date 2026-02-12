import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get session cookie
    const session = request.cookies.get('auth_session');

    // Admin routes that require authentication
    const adminRoutes = ['/super-admin', '/shop-admin'];

    // Check if current path is an admin route
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // Auth API routes
    const authRoutes = ['/login', '/api/auth/login', '/api/auth/forgot-password', '/api/auth/logout'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // If accessing login page with active session, redirect to dashboard
    if (pathname === '/login' && session) {
        try {
            const sessionData = JSON.parse(session.value);
            if (sessionData.role === 'super_admin') {
                return NextResponse.redirect(new URL('/super-admin', request.url));
            } else if (sessionData.role === 'shop') {
                return NextResponse.redirect(new URL(`/shop-admin/${sessionData.slug}`, request.url));
            }
        } catch (error) {
            // Invalid session, continue to login
        }
    }

    // Allow access to auth routes and all non-admin routes (end-user pages)
    if (isAuthRoute || !isAdminRoute) {
        return NextResponse.next();
    }

    // Protect super-admin routes
    if (pathname.startsWith('/super-admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const sessionData = JSON.parse(session.value);

            if (sessionData.role !== 'super_admin') {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } catch (error) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        return NextResponse.next();
    }

    // Protect shop-admin routes
    if (pathname.startsWith('/shop-admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const sessionData = JSON.parse(session.value);

            // Extract shop ID from URL (using shop-id parameter)
            const shopIdMatch = pathname.match(/\/shop-admin\/([^\/]+)/);
            const requestedShopId = shopIdMatch ? shopIdMatch[1] : null;

            // Super admin can access any shop
            if (sessionData.role === 'super_admin') {
                return NextResponse.next();
            }

            // Shop managers can only access their own shop (compare slug)
            if (sessionData.role === 'shop' && sessionData.slug === requestedShopId) {
                return NextResponse.next();
            }

            // Unauthorized access
            return NextResponse.redirect(new URL('/login', request.url));
        } catch (error) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // This should never be reached since we handle admin routes above
    // and non-admin routes are allowed through earlier
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)  
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
