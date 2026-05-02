'use client';

import React, { useState, useEffect } from 'react';
import { DEPARTMENTS, PROVINCES, DISTRICTS } from '@/lib/ubigeo-data';

interface UbigeoSelectorProps {
  onSelect: (data: {
    department: string;
    province: string;
    district: string;
    ubigeoCode: string;
  }) => void;
  initialUbigeo?: string;
  className?: string;
}

export function UbigeoSelector({ onSelect, initialUbigeo, className }: UbigeoSelectorProps) {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');

  // Handle initial ubigeo code
  useEffect(() => {
    if (initialUbigeo && initialUbigeo.length === 6) {
      const deptId = initialUbigeo.substring(0, 2);
      const provId = initialUbigeo.substring(0, 4);
      
      setSelectedDept(deptId);
      setSelectedProv(provId);
      setSelectedDist(initialUbigeo);
    }
  }, [initialUbigeo]);

  const provinces = PROVINCES.filter(p => p.departmentId === selectedDept);
  const districts = DISTRICTS.filter(d => d.provinceId === selectedProv);

  const lastEmittedCode = React.useRef('');
  
  useEffect(() => {
    if (selectedDept && selectedProv && selectedDist) {
      if (lastEmittedCode.current === selectedDist) return;
      
      const deptName = DEPARTMENTS.find(d => d.id === selectedDept)?.name || '';
      const provName = PROVINCES.find(p => p.id === selectedProv)?.name || '';
      const distName = DISTRICTS.find(d => d.id === selectedDist)?.name || '';
      
      lastEmittedCode.current = selectedDist;
      onSelect({
        department: deptName,
        province: provName,
        district: distName,
        ubigeoCode: selectedDist
      });
    }
  }, [selectedDept, selectedProv, selectedDist, onSelect]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Departamento</label>
        <select
          required
          className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none appearance-none"
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setSelectedProv('');
            setSelectedDist('');
          }}
        >
          <option value="">Selecciona...</option>
          {DEPARTMENTS.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Provincia</label>
        <select
          required
          disabled={!selectedDept}
          className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none appearance-none disabled:opacity-50"
          value={selectedProv}
          onChange={(e) => {
            setSelectedProv(e.target.value);
            setSelectedDist('');
          }}
        >
          <option value="">Selecciona...</option>
          {provinces.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-2">Distrito</label>
        <select
          required
          disabled={!selectedProv}
          className="w-full bg-cream/30 border border-sand rounded-2xl py-3 px-4 focus:ring-1 focus:ring-primary outline-none appearance-none disabled:opacity-50"
          value={selectedDist}
          onChange={(e) => setSelectedDist(e.target.value)}
        >
          <option value="">Selecciona...</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
