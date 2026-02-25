"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Book, Layout, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/agt-panel/components/ui/alert-dialog";

export default function RootHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user?.role === "submission-admin") {
      router.replace("/book-panel/admin/bookorder");
    }
  }, [status, session, router]);

  if (status === "loading" || (status === "authenticated" && session?.user?.role === "submission-admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-100 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-100/50 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-100/50 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-100 pointer-events-none"></div>
      </div>

      <nav className="relative z-20 flex justify-between items-center px-8 py-4 max-w-7xl mx-auto border-b border-slate-200/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-9 rounded-lg flex items-center justify-center shadow-sm">
            <img src="/book-panel/logo.png" alt="" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">AP Book Panel</span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:block">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Welcome back,</p>
            <p className="text-sm font-bold text-slate-800">{session?.user?.name || session?.user?.email}</p>
          </div>
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center space-x-2 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all duration-300 group shadow-sm"
          >
            <LogOut size={16} className="text-slate-500 group-hover:text-red-500 transition-colors" />
            <span className="text-sm font-semibold text-slate-700">Logout</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {/* <div className="text-center mb-16 space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Select Your Panel
          </h1>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Welcome to the AGT Book Panel. Please choose the panel you wish to access.
          </p>
        </div> */}

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Card 1: AGT Panel */}
          <Link href="/agt-panel/admin/dashboard" className="group">
            <div className="relative h-full bg-white border border-slate-200 rounded-sm p-8 transition-all duration-500 hover:border-purple-500/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.15)]">
              <div className="relative z-10 h-full flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 group-hover:text-purple-600 transition-colors">AGT Book Management</h2>
                <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
                  Manage book inventory, track reader interests, and streamline your literary operations with advanced analytics and reporting tools.
                </p>
                <div className="flex items-center text-purple-600 font-bold group-hover:translate-x-2 transition-transform">
                  Enter Dashboard <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-sm" />
            </div>
          </Link>

          {/* Card 2: Book Panel */}
          <Link href="/book-panel/admin/bookorder" className="group">
            <div className="relative h-full bg-white border border-slate-200 rounded-sm p-8 transition-all duration-500 hover:border-blue-500/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)]">
              <div className="relative z-10 h-full flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 group-hover:text-blue-600 transition-colors">Book Order & Forms</h2>
                <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
                  Process book orders, handle submissions, and oversee the entire distribution pipeline from a powerful, unified interface.
                </p>
                <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                  Enter Dashboard <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-sm" />
            </div>
          </Link>
        </div>
      </main>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 font-bold">Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              You will be redirected to the login page and will need to sign in again to access the panels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
