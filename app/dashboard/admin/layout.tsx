import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  ShoppingBag, 
  BarChart3, 
  ArrowLeft,
  ShieldCheck,
  Banknote,
  LayoutDashboard
} from "lucide-react";
import { AdminMobileNav } from "./AdminMobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Protección de ruta: Solo administradores
  if (!session || (session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  const navItems = [
    { href: "/dashboard/admin/crm", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/admin/vendedores", label: "Vendedores", icon: Users },
    { href: "/dashboard/admin/ventas", label: "Ventas Realizadas", icon: ShoppingBag },
    { href: "/dashboard/admin/comisiones", label: "Comisiones", icon: Banknote },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar Admin - Desktop */}
      <aside className="hidden lg:flex w-64 bg-primary text-cream fixed inset-y-0 left-0 z-50 flex-col shadow-2xl">
        <div className="p-8 border-b border-cream/10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-[#00E0A6]" />
            <span className="font-serif font-bold text-xl tracking-tight">Panel Admin</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-cream/60 font-medium">Moda Circular CRM</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-cream/10">
          <Link 
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver al Perfil
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-10 pb-24 lg:pb-10">
        <div className="lg:hidden mb-8">
            <AdminMobileNav items={navItems} />
        </div>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
