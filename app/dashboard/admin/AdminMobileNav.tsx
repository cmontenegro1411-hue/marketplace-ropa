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
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-sand shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#008F6A]" />
          <span className="font-serif font-bold text-lg text-primary">Admin Panel</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-sand/30 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* Overlay Drawer */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'}`}>
        <div 
          className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        <div className={`absolute inset-y-0 right-0 w-[80%] max-w-xs bg-primary text-cream shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#00E0A6]" />
                <span className="font-serif font-bold text-xl">Admin</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="space-y-4">
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-cream/70'}`}
                  >
                    {(() => {
                      const Icon = ICON_MAP[item.icon];
                      return Icon ? <Icon className="w-5 h-5" /> : null;
                    })()}
                    <span className="font-bold text-sm uppercase tracking-widest">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10">
              <Link 
                href="/profile"
                className="flex items-center gap-3 p-4 text-cream/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
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
