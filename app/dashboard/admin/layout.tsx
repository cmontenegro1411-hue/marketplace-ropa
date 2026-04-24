import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  ShoppingBag, 
  BarChart3, 
  ArrowLeft,
  ShieldCheck,
  Banknote
} from "lucide-react";

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

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-primary text-cream fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-cream/10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-[#00E0A6]" />
            <span className="font-serif font-bold text-xl tracking-tight">Panel Admin</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-cream/60 font-medium">Moda Circular CRM</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4">
          <Link 
            href="/dashboard/admin/crm"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Link>
          <Link 
            href="/dashboard/admin/vendedores"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            Vendedores
          </Link>
          <Link 
            href="/dashboard/admin/ventas"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <ShoppingBag className="w-4 h-4" />
            Ventas Realizadas
          </Link>
          <Link 
            href="/dashboard/admin/comisiones"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <Banknote className="w-4 h-4" />
            Comisiones
          </Link>
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
      <main className="flex-1 ml-64 p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
