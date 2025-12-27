import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',           // Student login page
  '/admin/login',     // Admin login page
  '/register',        // Student registration page
  '/about',           // About page
  // API routes that don't require authentication
  '/api/auth',
  '/api/proxy',
];

// Define admin-only routes (including sub-routes)
const adminRoutes = [
  '/admin',
];

// Define routes that require authentication but are not admin-specific
const protectedRoutes = [
  '/dashboard',
];

// Define exam routes that might be accessible to guests for public exams
const examRoutes = [
  '/dashboard/exams',
];

export function middleware(request: NextRequest) {
  // Check if the current route is public
  const isPublicRoute = isPathInRoutes(request.nextUrl.pathname, publicRoutes);

  // Check if the current route is an admin route
  const isAdminRoute = isPathInRoutes(request.nextUrl.pathname, adminRoutes);

  // Check if the current route is a protected route
  const isProtectedRoute = isPathInRoutes(request.nextUrl.pathname, protectedRoutes);

  // Check if the current route is an exam route (might allow guest access for public exams)
  const isExamRoute = isPathInRoutes(request.nextUrl.pathname, examRoutes);

  // For server-side middleware, we can't access localStorage directly
  // We need to check for authentication tokens in cookies or headers
  // Since your app uses localStorage on the client, we'll need to implement a proper session/JWT system
  // For now, we'll check for a session cookie that would be set after successful authentication

  const isAuthenticated = checkAuthentication(request);
  const isAdmin = checkAdminStatus(request);

  // If accessing a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Special handling for exam routes - they might be accessible to guests for public exams
  if (isExamRoute) {
    // Exam routes are allowed for both authenticated users and potentially for guest users
    // The actual authorization check happens in the component based on whether the exam is public
    // For now, we'll allow access to exam routes and let the component handle the public/private logic
    return NextResponse.next();
  }

  // If accessing a protected route without authentication
  if (isProtectedRoute || isAdminRoute) {
    if (!isAuthenticated) {
      // Redirect to login page
      const loginUrl = isAdminRoute ? '/admin/login' : '/login';
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    // If accessing admin route, check if user is admin
    if (isAdminRoute && !isAdmin) {
      // Redirect to student dashboard or show unauthorized page
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Allow access to protected routes if user is authenticated
  return NextResponse.next();
}

// Helper function to check if a path matches any of the routes
function isPathInRoutes(path: string, routes: string[]): boolean {
  return routes.some(route =>
    path === route ||
    path.startsWith(route + '/') ||
    (route.endsWith('/') && path.startsWith(route))
  );
}

// Helper function to check authentication
// In a real implementation, you would verify a JWT token or session cookie
function checkAuthentication(request: NextRequest): boolean {
  try {
    // Check for authentication token in cookies
    // You would need to implement a proper session system that sets a cookie after login
    const token = request.cookies.get('auth-token')?.value ||
                  request.cookies.get('session')?.value;

    if (!token) {
      // Also check for Authorization header (for API routes)
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // In a real app, you would verify the JWT token here
        // Example: decode and verify JWT using a library like jose or jsonwebtoken
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // return decoded !== null;
        return true; // Placeholder - implement proper JWT verification
      }
      return false;
    }

    // In a real implementation, you would decode and verify the JWT token here
    // Example implementation:
    // try {
    //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //   return decoded !== null;
    // } catch (err) {
    //   console.error('Token verification failed:', err);
    //   return false;
    // }

    // For now, just return true if token exists (implement proper verification in production)
    return true; // Placeholder - implement proper JWT verification
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Helper function to check if user is admin
// This would need to be implemented based on your admin detection logic
function checkAdminStatus(request: NextRequest): boolean {
  // In your current setup, you might need to decode the JWT token to check for admin status
  // Or check for a specific admin session cookie
  const token = request.cookies.get('auth-token')?.value;

  // Based on your types, you have separate User and Admin types
  // You might store admin status in the token payload or have a separate admin session
  // For now, this is a placeholder - implement based on your actual authentication system
  // You might check for a specific claim in the JWT token or a dedicated admin cookie

  // Example implementation (would need to be adapted to your actual system):
  // 1. Decode JWT token and check for admin role
  // 2. Check for a specific admin session cookie
  // 3. Query your backend to verify admin status

  // Using the token variable to avoid the unused variable warning
  if (token) {
    // In a real implementation, you would decode and verify the token to check for admin status
    // For now, return false as a placeholder
    return false; // Placeholder - implement proper admin check
  }

  return false; // Placeholder - implement proper admin check
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};