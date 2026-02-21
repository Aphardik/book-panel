// import { withAuth } from "next-auth/middleware"
// import { NextResponse } from "next/server"

// export default withAuth(
//   function middleware(req) {
//     const { pathname } = req.nextUrl
//     const role = req.nextauth.token?.role

//     // Role-based redirection for book-panel
//     if (pathname.startsWith("/book-panel/admin")) {
//       const subPath = pathname.replace("/book-panel/admin", "/admin");

//       if (role === "super admin") {
//         return NextResponse.next()
//       }

//       if (subPath.startsWith("/admin/bookorder") && role === "submission-admin") {
//         return NextResponse.next()
//       }

//       if (subPath.startsWith("/admin") && role === "submission-admin") {
//         // Redirect submission-admin to their specific area if they try to access general admin
//         return NextResponse.redirect(new URL("/book-panel/admin/bookorder", req.url))
//       }

//       if (subPath.startsWith("/admin/forms") || subPath.startsWith("/admin/dashboard")) {
//         if (role !== "formbuilder-admin" && role !== "super admin") {
//           return NextResponse.redirect(new URL("/access-denied", req.url))
//         }
//       }

//       if (subPath.startsWith("/admin/bookorder")) {
//         if (role !== "submission-admin" && role !== "super admin") {
//           return NextResponse.redirect(new URL("/access-denied", req.url))
//         }
//       }
//     }

//     // Role-based protection for AGT Panel
//     if (pathname.startsWith("/agt-panel/admin")) {
//       // Allow super admin or specific agt-admin to access
//       if (role !== "super admin" && role !== "agt-admin") {
//         return NextResponse.redirect(new URL("/access-denied", req.url))
//       }
//     }

//     return NextResponse.next()
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => !!token,
//     },
//     pages: {
//       signIn: "/login",
//     },
//   }
// )

// export const config = {
//   matcher: [
//     "/",
//     "/agt-panel/:path*",
//     "/book-panel/((?!.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp).*)",
//   ],
// };

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    // Root page — role-based redirect
    if (pathname === "/") {
      if (role === "super admin") {
        return NextResponse.next()
      }
      if (role === "submission-admin") {
        return NextResponse.redirect(new URL("/book-panel/admin/bookorder", req.url))
      }
      if (role === "agt-admin") {
        return NextResponse.redirect(new URL("/agt-panel/admin", req.url))
      }
      // Any other role — deny
      return NextResponse.redirect(new URL("/access-denied", req.url))
    }

    // Role-based redirection for book-panel
    if (pathname.startsWith("/book-panel/admin")) {
      const subPath = pathname.replace("/book-panel/admin", "/admin");

      if (role === "super admin") {
        return NextResponse.next()
      }

      if (subPath.startsWith("/admin/bookorder") && role === "submission-admin") {
        return NextResponse.next()
      }

      if (subPath.startsWith("/admin") && role === "submission-admin") {
        return NextResponse.redirect(new URL("/book-panel/admin/bookorder", req.url))
      }

      if (subPath.startsWith("/admin/forms") || subPath.startsWith("/admin/dashboard")) {
        if (role !== "formbuilder-admin" && role !== "super admin") {
          return NextResponse.redirect(new URL("/access-denied", req.url))
        }
      }

      if (subPath.startsWith("/admin/bookorder")) {
        if (role !== "submission-admin" && role !== "super admin") {
          return NextResponse.redirect(new URL("/access-denied", req.url))
        }
      }
    }

    // Role-based protection for AGT Panel
    if (pathname.startsWith("/agt-panel/admin")) {
      if (role !== "super admin" && role !== "agt-admin") {
        return NextResponse.redirect(new URL("/access-denied", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/",
    "/agt-panel/:path*",
    "/book-panel/((?!.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};
