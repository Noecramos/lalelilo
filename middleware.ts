import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get session cookie
    const session = request.cookies.get('auth_session');

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/api/auth/login', '/api/auth/forgot-password'];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute) {
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

            // Extract shop ID from URL
            const shopIdMatch = pathname.match(/\/shop-admin\/([^\/]+)/);
            const requestedShopId = shopIdMatch ? shopIdMatch[1] : null;

            // Super admin can access any shop
            if (sessionData.role === 'super_admin') {
                return NextResponse.next();
            }

            // Shop managers can only access their own shop
            if (sessionData.role === 'shop' && sessionData.shopId === requestedShopId) {
                return NextResponse.next();
            }

            // Unauthorized access
            return NextResponse.redirect(new URL('/login', request.url));
        } catch (error) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/super-admin/:path*',
        '/shop-admin/:path*',
    ],
};
