import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maheba — Makeup, Henna & Bakers in Kenya",
  description:
    "Discover approved makeup artists, henna artists and bakers in Kenya. Contact providers directly via WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="h-1.5 bg-gradient-to-r from-blush-300 via-fuchsia-300 to-amber-200" />
        <header className="sticky top-0 z-10 border-b border-blush-100 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl leading-none text-plum-900">
                Maheba
              </span>
              <span className="font-script text-xl leading-none text-blush-500">
                kenya ♡
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-bold text-plum-700">
              <Link
                href="/"
                className="rounded-full px-3 py-1.5 hover:bg-blush-50"
              >
                Explore
              </Link>
              <Link
                href="/dashboard"
                className="hidden rounded-full px-3 py-1.5 hover:bg-blush-50 sm:inline"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-1.5 hover:bg-blush-50 sm:inline"
              >
                Login
              </Link>
              <Link
                href="/admin"
                className="hidden rounded-full px-3 py-1.5 hover:bg-blush-50 sm:inline"
              >
                Admin
              </Link>
              <Link
                href="/join"
                className="rounded-full bg-gradient-to-r from-blush-400 to-fuchsia-400 px-4 py-1.5 text-white shadow-sm hover:opacity-90"
              >
                Join ✿
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </div>
        <footer className="border-t border-blush-100 bg-blush-50/60">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs font-semibold text-plum-500">
            made with ♡ in kenya · approved + subscribed providers only ·
            M-Pesa monthly subscription
          </div>
        </footer>
      </body>
    </html>
  );
}
