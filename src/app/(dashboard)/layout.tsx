import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Bell, BellRing, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alerts", label: "Mis Alertas", icon: BellRing },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-neutral-200 bg-white">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold text-primary-700">
            HoraDoc
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-800 hover:bg-primary-50 hover:text-primary-700 transition-colors [&.active]:bg-primary-50 [&.active]:text-primary-700"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-6 lg:px-8">
          <div className="lg:hidden">
            <Link href="/" className="text-lg font-bold text-primary-700">
              HoraDoc
            </Link>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-neutral-800">Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-neutral-600" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm lg:hidden">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex items-center justify-around px-2 py-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-neutral-500 hover:text-primary-600 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
