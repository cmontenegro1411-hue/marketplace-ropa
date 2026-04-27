'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container } from './Container';
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { CreditsCounter } from '@/components/ai-listing/CreditsCounter';
import { Menu, X, ShoppingCart, Search, User, LogOut, Tag } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  brand: string;
  price: number;
  images: string[];
}

export const Navbar = () => {
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from('products')
        .select('id, title, brand, price, images')
        .or(`title.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .limit(5);
      setSuggestions((data as Suggestion[]) || []);
      setIsSearching(false);
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="glass sticky top-0 z-50">
      <Container className="flex items-center justify-between h-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="md:hidden p-2 hover:bg-sand/50 rounded-full transition-colors text-primary"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl md:text-2xl font-bold font-serif text-primary tracking-tighter transition-all group-hover:tracking-normal">ModaCircular</span>
          </Link>
        </div>
        
        {!isSearchOpen && (
          <div className="hidden md:flex items-center gap-8 lg:gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">
            <Link href="/search?cat=Mujer" className="hover:text-primary transition-colors">Mujer</Link>
            <Link href="/search?cat=Hombre" className="hover:text-primary transition-colors">Hombre</Link>
            <Link href="/search?cat=Ni%C3%B1os" className="hover:text-primary transition-colors">Niños</Link>
            <Link href="/search?cat=Unisex" className="hover:text-primary transition-colors">Unisex</Link>
          </div>
        )}

        <div className="relative flex items-center gap-2 md:gap-4" ref={searchRef}>
          {isSearchOpen ? (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px] sm:w-[300px] md:w-[450px] z-50">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar..."
                  className="w-full bg-white border border-sand rounded-2xl py-3 px-6 text-sm shadow-xl focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted p-1">
                  <X size={18} />
                </button>

                {searchQuery.length >= 2 && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-sand rounded-2xl shadow-2xl overflow-hidden">
                    {suggestions.length > 0 ? (
                      <div className="p-2">
                        {suggestions.map((item) => (
                          <Link key={item.id} href={`/product/${item.id}`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-4 p-3 hover:bg-cream rounded-xl transition-colors">
                            <div className="w-10 h-10 bg-sand/30 rounded overflow-hidden">
                              <img src={item.images?.[0] || '/placeholder.png'} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-primary truncate">{item.title}</p>
                                <p className="text-[9px] text-muted uppercase">{item.brand}</p>
                            </div>
                            <div className="text-xs font-bold">${item.price}</div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      !isSearching && <div className="p-4 text-center text-xs text-muted">No hay resultados</div>
                    )}
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1 md:gap-4">
              <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-sand/50 rounded-full transition-colors text-primary">
                <Search size={20} />
              </button>

              <Link href="/cart" className="p-2 hover:bg-sand/50 rounded-full transition-colors relative group text-primary">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                    {totalItems}
                  </span>
                )}
              </Link>
              
              <div className="h-6 w-px bg-sand mx-1 hidden md:block"></div>

              {session && <div className="hidden sm:block"><CreditsCounter /></div>}

              {session ? (
                <div className="hidden sm:flex items-center gap-2 md:gap-3">
                  { (session.user as any).role === 'admin' && (
                    <Link href="/dashboard/admin/crm" className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#008F6A] bg-[#00E0A6]/10 border border-[#00E0A6]/30 rounded-full px-3 py-2 hover:bg-[#00E0A6]/20 transition-all">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00E0A6] animate-pulse"></span>
                      Admin
                    </Link>
                  )}
                  <Link href="/profile" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-sand rounded-full px-3 py-2 transition-colors">Mi Closet</Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:underline">Salir</button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1">
                  <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-primary px-3 py-2 hover:bg-sand rounded-full">Login</Link>
                </div>
              )}

              <Link href="/dashboard/sell" className="hidden sm:flex bg-primary text-cream px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all">Vender</Link>
            </div>
          )}
        </div>
      </Container>

      {/* MOBILE MENU OVERLAY */}
      <div className={`fixed inset-0 bg-primary/20 backdrop-blur-md z-[60] transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`absolute inset-y-0 left-0 w-[80%] max-w-sm bg-cream shadow-2xl transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-12">
              <span className="text-xl font-bold font-serif text-primary tracking-tighter">ModaCircular</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-sand rounded-full transition-colors text-primary">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 mb-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted mb-6">Explorar</p>
                <div className="flex flex-col gap-6">
                  {['Mujer', 'Hombre', 'Niños', 'Unisex'].map((cat) => (
                    <Link 
                      key={cat} 
                      href={`/search?cat=${cat}`} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-2xl font-serif font-bold text-primary hover:text-accent transition-colors flex items-center justify-between"
                    >
                      {cat}
                      <Tag size={16} className="text-sand" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="h-px bg-sand/50 w-full"></div>

              <div className="flex flex-col gap-6">
                <Link 
                  href="/dashboard/sell" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group flex items-center justify-between p-4 bg-primary text-cream rounded-2xl transition-all active:scale-95"
                >
                  <span className="text-sm font-bold uppercase tracking-widest">Vender Prenda</span>
                  <Tag size={18} />
                </Link>
                
                {session ? (
                  <>
                    { (session.user as any).role === 'admin' && (
                      <Link 
                        href="/dashboard/admin/crm" 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="flex items-center gap-3 text-lg font-bold text-[#008F6A]"
                      >
                        <div className="w-2 h-2 rounded-full bg-[#00E0A6] animate-pulse"></div>
                        Administración
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-lg font-bold text-primary">
                      <User size={20} /> Mi Closet
                    </Link>
                    <button onClick={() => { setIsMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }} className="flex items-center gap-3 text-lg font-bold text-secondary text-left">
                      <LogOut size={20} /> Salir
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-lg font-bold text-primary">
                    <User size={20} /> Iniciar Sesión
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-auto">
              {session && (
                <div className="bg-white p-6 rounded-3xl border border-sand mb-6">
                   <CreditsCounter />
                </div>
              )}
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted text-center italic">Curaduría Ética & Moda Circular</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
