"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse, Search, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  user: { email: string; full_name?: string } | null;
}

function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e5e4] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <HeartPulse className="h-7 w-7 text-[#14b8a6]" />
            <span className="text-xl font-bold text-[#1c1917]">HoraDoc</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/search"
              className="flex items-center gap-1.5 text-sm font-medium text-[#57534e] transition-colors hover:text-[#14b8a6]"
            >
              <Search className="h-4 w-4" />
              Buscar
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#57534e] transition-colors hover:text-[#14b8a6]"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#292524] transition-colors hover:bg-[#f5f5f4]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14b8a6] text-white text-xs font-bold">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">
                  {user.full_name || user.email}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#e7e5e4] bg-white py-1 shadow-lg">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#292524] hover:bg-[#f5f5f4]"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Mi perfil
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#ef4444] hover:bg-[#f5f5f4]"
                  >
                    <LogOut className="h-4 w-4" />
                    Salir
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Ingresar
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-[#292524]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#e7e5e4] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#57534e] hover:bg-[#f5f5f4]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="h-4 w-4" />
              Buscar
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#57534e] hover:bg-[#f5f5f4]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {!user && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#e7e5e4]">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="md" className="w-full">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export { Header };
