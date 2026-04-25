'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Filter, X } from 'lucide-react';
import { useState } from 'react';

export default function CRMFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';
  const currentPreset = searchParams.get('preset') || 'all';

  const updateFilters = (params: { from?: string; to?: string; preset?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (params.from !== undefined) {
      if (params.from) newParams.set('from', params.from);
      else newParams.delete('from');
    }
    
    if (params.to !== undefined) {
      if (params.to) newParams.set('to', params.to);
      else newParams.delete('to');
    }
    
    if (params.preset !== undefined) {
      if (params.preset && params.preset !== 'all') newParams.set('preset', params.preset);
      else newParams.delete('preset');
    }

    router.push(`?${newParams.toString()}`);
  };

  const clearFilters = () => {
    router.push('?');
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] editorial-shadow border border-sand/50 mb-8">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Filter size={14} />
          Filtrar Reporte
        </div>

        <div className="h-8 w-px bg-sand/30 hidden md:block" />

        <div className="flex gap-2">
          {['all', 'this_month', 'last_month', 'last_3_months'].map((preset) => (
            <button
              key={preset}
              onClick={() => updateFilters({ preset, from: '', to: '' })}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border ${
                currentPreset === preset 
                ? 'bg-primary text-white border-primary shadow-sm' 
                : 'bg-slate-50 text-muted border-sand/30 hover:border-accent'
              }`}
            >
              {preset === 'all' && 'Todo'}
              {preset === 'this_month' && 'Este Mes'}
              {preset === 'last_month' && 'Mes Pasado'}
              {preset === 'last_3_months' && 'Últimos 3 Meses'}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-sand/30 hidden lg:block" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-sand/30 rounded-xl px-3 py-1">
            <Calendar size={12} className="text-muted" />
            <input 
              type="date" 
              value={currentFrom}
              onChange={(e) => updateFilters({ from: e.target.value, preset: 'custom' })}
              className="bg-transparent text-[10px] font-bold text-primary focus:outline-none"
            />
          </div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">al</span>
          <div className="flex items-center gap-2 bg-slate-50 border border-sand/30 rounded-xl px-3 py-1">
            <Calendar size={12} className="text-muted" />
            <input 
              type="date" 
              value={currentTo}
              onChange={(e) => updateFilters({ to: e.target.value, preset: 'custom' })}
              className="bg-transparent text-[10px] font-bold text-primary focus:outline-none"
            />
          </div>
        </div>

        {(currentFrom || currentTo || (currentPreset && currentPreset !== 'all')) && (
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-tight ml-auto"
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
