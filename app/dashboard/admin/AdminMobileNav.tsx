'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  Users,
  ShoppingBag,
  Banknote
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BarChart3,
  Users,
  ShoppingBag,
  Banknote
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const AdminMobileNav = ({ items }: { items: NavItem[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="sticky top-0 z-[60] lg:hidden mb-6 -mx-4 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-sand">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-[#00E0A6]/10 p-2 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-[#008F6A]" />
          </div>
          <div>
            <span className="block font-serif font-bold text-base text-primary leading-none">Panel Admin</span>
            <span className="text-[8px] uppercase tracking-widest text-muted font-bold">Moda Circular CRM</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-3 hover:bg-sand/30 rounded-2xl transition-all active:scale-90"
        >
          <Menu className="w-5 h-5 text-primary" />
        </button>
      </div>
    </div>

      {/* Overlay Drawer */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'}`}>
        <div 
          className="absolute inset-0 bg-primary/20 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />
        
        <div className={`absolute inset-y-0 left-0 w-[85%] max-w-xs bg-cream shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#008F6A]" />
                <span className="font-serif font-bold text-xl text-primary">Admin</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-sand rounded-full transition-colors text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-3">
              {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = ICON_MAP[item.icon];
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-primary text-cream shadow-lg shadow-primary/20' : 'hover:bg-sand text-primary/70'}`}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span className="font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-8 border-t border-sand">
              <Link 
                href="/profile"
                className="flex items-center gap-3 p-4 text-primary/60 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
