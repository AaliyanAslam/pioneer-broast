"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import toast from "react-hot-toast";
import {
  PiCircleNotch,
  PiEnvelopeSimple,
  PiLockKey,
  PiArrowLeft,
} from "react-icons/pi";

export default function AuthForm({ onGuestCheckout }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Successfully logged in!");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Signup successful! Please check your email.");
      }
    } catch (error) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/cart", // redirect back to checkout
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error("Google authentication failed");
    }
  };

  return (
    <div className="w-full bg-zinc-950 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border sm:border border-zinc-800/80 sm:border-zinc-800/80 relative">
      {onGuestCheckout && (
        <button
          onClick={onGuestCheckout}
          type="button"
          className="mb-4 sm:mb-6 text-zinc-500 hover:text-white flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors w-fit group"
        >
          <PiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />{" "}
          Continue as Guest
        </button>
      )}
      <div className="mb-5 sm:mb-8 text-left">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-1.5 sm:mb-3">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-zinc-400 text-[11px] sm:text-sm leading-relaxed max-w-[95%]">
          {isLogin
            ? "Log in to access your saved details and track orders."
            : "Sign up for a seamless premium checkout experience."}
        </p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4 sm:space-y-5">
        <div>
          <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5 sm:mb-2 ml-0.5">
            Email Address
          </label>
          <div className="relative">
            <PiEnvelopeSimple className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-[13px] sm:text-base text-white focus:outline-none focus:border-[#C0E212] focus:ring-1 focus:ring-[#C0E212] transition-all"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5 sm:mb-2 ml-0.5">
            Password
          </label>
          <div className="relative">
            <PiLockKey className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-[13px] sm:text-base text-white focus:outline-none focus:border-[#C0E212] focus:ring-1 focus:ring-[#C0E212] transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C0E212] text-black font-black uppercase tracking-widest py-3.5 sm:py-4 rounded-xl active:rounded-2xl active:scale-[0.98] transition-all hover:bg-[#a6c40e] disabled:opacity-50 flex items-center justify-center mt-4 sm:mt-6 text-[13px] sm:text-sm shadow-[0_0_20px_rgba(192,226,18,0.15)]"
        >
          {loading ? (
            <PiCircleNotch className="w-5 h-5 animate-spin" />
          ) : isLogin ? (
            "Log In"
          ) : (
            "Sign Up"
          )}
        </button>
      </form>

      <div className="my-5 sm:my-8 flex items-center gap-4 opacity-70">
        <div className="h-px bg-zinc-800 flex-1" />
        <span className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">
          Or continue with
        </span>
        <div className="h-px bg-zinc-800 flex-1" />
      </div>

      <button
        onClick={handleGoogleAuth}
        type="button"
        className="w-full bg-white text-black font-bold py-3.5 sm:py-4 rounded-xl active:rounded-2xl active:scale-[0.98] transition-all hover:bg-zinc-200 flex items-center justify-center gap-3 text-[13px] sm:text-base shadow-sm"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 sm:w-6 sm:h-6"
          aria-hidden="true"
        >
          <path
            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
            fill="#EA4335"
          />
          <path
            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
            fill="#4285F4"
          />
          <path
            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
            fill="#FBBC05"
          />
          <path
            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
            fill="#34A853"
          />
        </svg>
        Google
      </button>

      <p className="text-center text-[11px] sm:text-sm text-zinc-500 mt-5 sm:mt-8">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          type="button"
          className="text-white hover:text-[#C0E212] font-black underline transition-colors"
        >
          {isLogin ? "Sign Up" : "Log In"}
        </button>
      </p>
    </div>
  );
}
