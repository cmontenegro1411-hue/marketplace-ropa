'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { FilterContent } from './FilterSidebar';

export const MobileFilterToggle = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8">
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-sand rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-transform"
      >
        <SlidersHorizontal size={14} className="text-secondary" />
        Filtros
      </button>

      {/* Overlay Mobile Filters */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="relative w-[85%] max-w-sm h-full bg-cream p-8 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-serif font-bold text-primary">Filtros</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-sand/20 rounded-full transition-colors"
              >
                <X size={24} className="text-primary" />
              </button>
            </div>

            <div className="filter-sidebar-mobile">
                <FilterContent />
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full mt-12 bg-primary text-cream py-4 rounded-full text-[10px] font-bold uppercase tracking-widest"
            >
              Ver Resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
