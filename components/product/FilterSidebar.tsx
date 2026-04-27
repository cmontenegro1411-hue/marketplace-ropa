'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const FilterSidebar = ({ className = "" }: { className?: string }) => {
  return (
    <aside className={className}>
      <FilterContent />
    </aside>
  );
};

export const FilterContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('cat') || '';
  const currentType = searchParams.get('type') || '';
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

  const segments = ['Mujer', 'Hombre', 'Niños', 'Unisex'];
  const types = ['Ropa', 'Calzado', 'Accesorios'];
  const conditions = ['Nuevo con etiqueta', 'Muy buen estado', 'Buen estado', 'Usado'];

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-6">Público</h3>
        <div className="space-y-3">
          <button 
            onClick={() => updateFilter('cat', '')}
            className={`block text-sm transition-all ${currentCategory === '' ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
          >
            Todos
          </button>
          {segments.map((seg) => (
            <button 
              key={seg}
              onClick={() => updateFilter('cat', seg)}
              className={`block text-sm transition-all ${currentCategory === seg ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-6">Producto</h3>
        <div className="space-y-3">
          <button 
            onClick={() => updateFilter('type', '')}
            className={`block text-sm transition-all ${currentType === '' ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
          >
            Ver todo
          </button>
          {types.map((t) => (
            <button 
              key={t}
              onClick={() => updateFilter('type', t)}
              className={`block text-sm transition-all ${currentType === t ? 'text-secondary font-bold underline underline-offset-8' : 'text-muted hover:text-primary'}`}
            >
              {t}
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

      {(currentCategory || currentType || currentCondition) && (
        <button 
          onClick={() => router.push('/search')}
          className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-primary pb-1 pt-4 opacity-60 hover:opacity-100 transition-opacity"
        >
          Limpiar todos los filtros
        </button>
      )}
    </div>
  );
};
