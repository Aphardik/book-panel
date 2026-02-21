"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";

const UnifiedLogin: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role === "submission-admin") {
                router.replace("/book-panel/admin/bookorder");
            } else {
                router.replace(callbackUrl);
            }
        }
    }, [status, router, callbackUrl, session]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password. Please try again.");
            } else {
                router.push(callbackUrl);
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Login error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans relative overflow-hidden">
            {/* Grainy noise texture overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-100 pointer-events-none z-0" />

            {/* Soft ambient blobs */}
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-violet-300/40 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-300/40 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-indigo-200/30 blur-[100px] rounded-full pointer-events-none" />

            {/* Main card */}
            <div className="relative z-10 w-full max-w-4xl bg-white/70 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-sm overflow-hidden flex">

                {/* Left column — decorative */}
                <div className="hidden md:flex w-1/2 relative flex-col justify-between p-10 overflow-hidden">
                    {/* Gradient mesh background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 opacity-90" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 pointer-events-none" />

                    {/* Decorative circles */}
                    <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full border border-white/20" />

                    <div className="relative flex flex-col gap- items-center justify-center z-10">
                        <Image src="/book-panel/logo.png" alt="logo" width={150} height={150} />
                        <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2">Adhyatm Parivar</p>
                        <h2 className="text-white text-center text-3xl font-bold leading-tight mb-4">
                            Welcome to Book Panel
                        </h2>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Access the Panel basis of your Role.
                        </p>
                    </div>

                    {/* <div className="relative z-10 flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {["bg-pink-400", "bg-yellow-400", "bg-emerald-400"].map((c, i) => (
                                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white/50`} />
                            ))}
                        </div>
                        <p className="text-white/60 text-xs">Adhyatm Parivar</p>
                    </div> */}
                </div>

                {/* Right column — form */}
                <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-800 mb-1">Get Started Now</h1>
                        <p className="text-slate-400 text-sm">Please log in to your account to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none transition-all placeholder-slate-300 shadow-sm"
                                    placeholder="workemail@gmail.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none transition-all placeholder-slate-300 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                            <label htmlFor="terms" className="text-xs text-slate-500">
                                I agree to the Terms & Privacy
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-violet-300/50 hover:shadow-md"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Log In</span>
                            )}
                        </button>

                    </form>


                </div>
            </div>
        </div>
    );
};

export default UnifiedLogin;