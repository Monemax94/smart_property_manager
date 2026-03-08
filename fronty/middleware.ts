import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Extract token from either the cookies or localStorage if needed, 
    // but localStorage is client-side only. We rely on cookies for Next.js middleware.
    const token = request.cookies.get('token')?.value;

    const protectedRoutes = ['/properties/new', '/properties/my-properties'];

    const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/properties/new', '/properties/my-properties', '/profile', '/settings'],
};
