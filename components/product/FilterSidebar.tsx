'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const FilterSidebar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('cat') || '';
  const currentCondition = searchParams.get('cond') || '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    router.push(`/search?${params.toString()}`);
  };

  const categories = ['Mujer', 'Hombre', 'Niños', 'Accesorios', 'Calzado'];
  const conditions = ['Nuevo con etiqueta', 'Muy buen estado', 'Buen estado', 'Usado'];

  return (
    <aside className="space-y-10 lg:sticky lg:top-24 h-fit">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-6">Categorías</h3>
        <div className="space-y-3">
          <button 
            onClick={() => updateFilter('cat', '')}
            className={`block text-sm transition-all ${currentCategory === '' ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
          >
            Todas las prendas
          </button>
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => updateFilter('cat', cat)}
              className={`block text-sm transition-all ${currentCategory === cat ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-6">Estado</h3>
        <div className="space-y-3">
          <button 
            onClick={() => updateFilter('cond', '')}
            className={`block text-sm transition-all ${currentCondition === '' ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
          >
            Cualquier estado
          </button>
          {conditions.map((cond) => (
            <button 
              key={cond}
              onClick={() => updateFilter('cond', cond)}
              className={`block text-sm transition-all ${currentCondition === cond ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {(currentCategory || currentCondition) && (
        <button 
          onClick={() => router.push('/search')}
          className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-primary pb-1 pt-4 opacity-60 hover:opacity-100 transition-opacity"
        >
          Limpiar todos los filtros
        </button>
      )}
    </aside>
  );
};
