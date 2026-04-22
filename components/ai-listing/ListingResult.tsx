'use client';

import React, { useState, useEffect, useRef } from 'react';
import { uploadMultipleImagesViaAPI } from '@/lib/storage';
import { createListing } from '@/app/actions/product-actions';
import { useRouter } from 'next/navigation';

export interface AIResult {
  titulo: string;
  descripcion: string;
  marca: string | null;
  confianza_marca: number;
  categoria: string;
  tipo_prenda: string; // Renombrado de subcategoria
  color: string;
  material: string;
  estilo: string[];
  condicion: string;
  precio_sugerido: number;
  precio_rango: { min: number; max: number };
  hashtags_instagram: string[];
  keywords_busqueda: string[];
  plataforma_ideal: string;
  advertencias: string[];
  modelo?: string;
  razonamiento_precio?: string;
}

const CATEGORIES = ['Mujer', 'Hombre', 'Niños', 'Accesorios', 'Calzado'];

interface ListingResultProps {
  result: AIResult;
  imageFile: File;
  onReset: () => void;
  aiUsageType?: 'free' | 'prepaid' | 'on_demand';
}

const CONDITION_MAP: Record<string, string> = {
  nuevo_con_etiqueta: 'Nuevo con etiqueta',
  muy_buen_estado:    'Muy buen estado',
  buen_estado:        'Buen estado',
  con_señales_de_uso: 'Usado',
};

const PLATFORM_ICONS: Record<string, string> = {
  depop:    '🛍️',
  poshmark: '👗',
  vinted:   '♻️',
  mercari:  '📦',
};

export const ListingResult = ({ result, imageFile, onReset, aiUsageType }: ListingResultProps) => {
  const router = useRouter();
  const [form, setForm] = useState<AIResult>({ ...result });
  const [size, setSize] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [suggestedUpdate, setSuggestedUpdate] = useState<{ precio_sugerido: number; precio_rango: { min: number; max: number } } | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const lastStateRef = useRef({ brand: form.marca, type: form.tipo_prenda, condition: form.condicion });

  const updateField = <K extends keyof AIResult>(key: K, value: AIResult[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Lógica de Smart Pricing Reactivo
  useEffect(() => {
    // Si no hay tipo de prenda, no podemos tasar
    if (!form.tipo_prenda) return;

    // Al cambiar cualquier valor clave, limpiamos sugerencias viejas de inmediato para evitar confusión
    setSuggestedUpdate(null);

    const timer = setTimeout(async () => {
      setIsRecalculating(true);
      try {
        const response = await fetch('/api/listings/recalculate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: form.marca || 'Genérico',
            modelo: form.modelo || '',
            tipo_prenda: form.tipo_prenda,
            condicion: form.condicion,
            categoria: form.categoria,
            current_price: form.precio_sugerido
          })
        });

        const json = await response.json();
        if (json.success) {
          // Actualizar confianza de marca si viene de la IA
          if (json.data.confianza_marca !== undefined) {
            updateField('confianza_marca', json.data.confianza_marca);
          }

          // Si el precio devuelto es sustancialmente distinto al actual, mostramos sugerencia
          if (Math.round(json.data.precio_sugerido) !== Math.round(form.precio_sugerido)) {
            setSuggestedUpdate(json.data);
          }
        }
      } catch (err) {
        console.error('Smart Pricing Error:', err);
      } finally {
        setIsRecalculating(false);
      }
    }, 600); // Rápida respuesta

    return () => clearTimeout(timer);
  }, [form.marca, form.modelo, form.tipo_prenda, form.condicion, form.categoria]);

  const applySuggestedPrice = () => {
    if (suggestedUpdate) {
      updateField('precio_sugerido', suggestedUpdate.precio_sugerido);
      updateField('precio_rango', suggestedUpdate.precio_rango);
      setSuggestedUpdate(null);
    }
  };

  const addHashtag = () => {
    const tag = newHashtag.trim().replace(/^#/, '');
    if (tag && !form.hashtags_instagram.includes(tag)) {
      updateField('hashtags_instagram', [...form.hashtags_instagram, tag]);
    }
    setNewHashtag('');
  };

  const removeHashtag = (tag: string) =>
    updateField(
      'hashtags_instagram',
      form.hashtags_instagram.filter((h) => h !== tag)
    );

  const copyDescription = async () => {
    const text = [
      form.titulo,
      '',
      form.descripcion,
      '',
      `Estado: ${CONDITION_MAP[form.condicion] || form.condicion}`,
      `Talla: ${size || 'Consultar'}`,
      `Precio: S/ ${form.precio_sugerido}`,
      '',
      form.hashtags_instagram.map((h) => `#${h}`).join(' '),
    ].join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Subir imagen a Supabase Storage
      const imageUrls = await uploadMultipleImagesViaAPI([imageFile]);

      // 2. Crear listing con datos del formulario
      const res = await createListing({
        title:       form.titulo,
        brand:       form.marca || 'Sin marca',
        category:    form.categoria,
        condition:   CONDITION_MAP[form.condicion] || form.condicion,
        size:        size || 'Única',
        description: form.descripcion,
        price:       form.precio_sugerido,
        images:      imageUrls,
        aiUsageType: aiUsageType,
      });

      if (res.success) {
        router.push('/profile');
      } else {
        alert('Error al publicar: ' + (res.error || 'Desconocido'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      alert('Error: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const conditionLabel = CONDITION_MAP[form.condicion] || form.condicion;
  const confidencePct = Math.round((form.confianza_marca ?? 0) * 100);

  const isLowConfidence = (form.confianza_marca ?? 1) < 0.4;
  const isBoutiquePotential = form.marca?.toLowerCase().includes('trich') || form.modelo?.toLowerCase().includes('heart');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header: Título + badges */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Título del listado</span>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full">
              {form.categoria}
            </span>
            <span className="bg-sand text-muted text-[10px] font-bold px-3 py-1 rounded-full">
              {conditionLabel}
            </span>
          </div>
        </div>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => updateField('titulo', e.target.value)}
          className="w-full text-base font-bold text-primary bg-cream/30 border border-sand rounded-2xl px-4 py-3 focus:border-primary outline-none"
        />

        {/* Marca y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Marca</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.marca ?? ''}
                onChange={(e) => updateField('marca', e.target.value || null)}
                placeholder="Sin marca"
                className="flex-1 bg-cream/30 border border-sand rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none"
              />
              {form.marca && (
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0
                    ${confidencePct >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                  title={`Confianza de detección: ${confidencePct}%`}
                >
                  {confidencePct}%
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Modelo (Opcional)</label>
            <input
              type="text"
              value={form.modelo ?? ''}
              onChange={(e) => updateField('modelo', e.target.value)}
              placeholder="Ej: Aviator, Air Force 1"
              className="w-full bg-cream/30 border border-sand rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Categoría</label>
            <select
              value={form.categoria}
              onChange={(e) => updateField('categoria', e.target.value)}
              className="w-full bg-cream/30 border border-sand rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none appearance-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Tipo de Prenda</label>
            <input
              type="text"
              value={form.tipo_prenda}
              onChange={(e) => updateField('tipo_prenda', e.target.value)}
              className="w-full bg-cream/30 border border-sand rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Precio */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Precio sugerido</span>
        <div className="flex items-end gap-6 flex-wrap">
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted">Precio (S/)</label>
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-bold text-muted">S/</span>
              <input
                type="number"
                value={form.precio_sugerido}
                onChange={(e) => updateField('precio_sugerido', Number(e.target.value))}
                className="w-28 text-2xl font-serif font-bold text-secondary bg-cream/30 border border-sand rounded-xl px-3 py-2.5 focus:border-secondary outline-none"
              />
            </div>
          </div>
          <div className="text-xs text-muted space-y-0.5">
            <p className="font-bold text-muted">Rango sugerido:</p>
            <p>S/ {form.precio_rango.min} — S/ {form.precio_rango.max}</p>
            {form.razonamiento_precio && (
              <p className="text-[10px] italic mt-1 text-primary/60 max-w-[200px]">
                {form.razonamiento_precio}
              </p>
            )}
          </div>

          {/* Sugerencia de la IA */}
          {suggestedUpdate && !isRecalculating && (
            <button
              onClick={applySuggestedPrice}
              className={`flex flex-col items-start gap-1 p-3 rounded-2xl border transition-all duration-300 text-left
                ${isLowConfidence 
                  ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 ring-1 ring-amber-100' 
                  : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {isLowConfidence ? 'Verificar Tasación' : 'Precio X Marca'}
                </span>
              </div>
              <div className="text-sm font-bold text-primary">
                Actualizar a S/ {Math.round(suggestedUpdate.precio_sugerido)}
              </div>
              {suggestedUpdate.razonamiento_precio && (
                <div className="text-[9px] text-primary/70 mt-1 leading-tight max-w-[180px]">
                  {suggestedUpdate.razonamiento_precio}
                </div>
              )}
              {isLowConfidence && !suggestedUpdate.razonamiento_precio && (
                <div className="text-[9px] text-amber-700 mt-1 leading-tight max-w-[140px]">
                  Baja confianza en marca. Verifica que el nombre sea correcto.
                </div>
              )}
            </button>
          )}

          {isRecalculating && (
             <div className="flex items-center gap-2 bg-secondary/5 px-3 py-2 rounded-xl border border-secondary/10 animate-pulse">
               <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-bounce" />
               <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">Recalculando precio...</span>
             </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Descripción</span>
          <button
            type="button"
            onClick={copyDescription}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
          >
            {copied ? '✓ Copiado' : '📋 Copiar todo'}
          </button>
        </div>
        <textarea
          rows={5}
          value={form.descripcion}
          onChange={(e) => updateField('descripcion', e.target.value)}
          className="w-full bg-cream/30 border border-sand rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Detalles */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Detalles</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted uppercase tracking-widest">Color</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => updateField('color', e.target.value)}
              className="w-full bg-cream/30 border border-sand rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted uppercase tracking-widest">Talla</label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Ej: M, 38, L, Única"
              className="w-full bg-cream/30 border border-sand rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted uppercase tracking-widest">Material</label>
            <input
              type="text"
              value={form.material}
              onChange={(e) => updateField('material', e.target.value)}
              className="w-full bg-cream/30 border border-sand rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Estilos */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted uppercase tracking-widest">Estilos detectados</label>
          <div className="flex flex-wrap gap-2">
            {form.estilo.map((s) => (
              <span key={s} className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Estado editable */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted uppercase tracking-widest">Estado de la prenda</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONDITION_MAP).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateField('condicion', key)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  form.condicion === key
                    ? 'bg-primary text-cream shadow-sm'
                    : 'bg-cream text-muted hover:bg-sand'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Marketing */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand space-y-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Marketing</span>

        {/* Hashtags */}
        <div className="space-y-3">
          <label className="text-[10px] text-muted uppercase tracking-widest">Hashtags Instagram</label>
          <div className="flex flex-wrap gap-2">
            {form.hashtags_instagram.map((tag) => (
              <span
                key={tag}
                className="bg-cream border border-sand text-primary text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 group"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(tag)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-secondary"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
              placeholder="Agregar hashtag..."
              className="flex-1 bg-cream/30 border border-sand rounded-xl px-3 py-2 text-sm focus:border-primary outline-none"
            />
            <button
              type="button"
              onClick={addHashtag}
              className="bg-primary text-cream px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted uppercase tracking-widest">Plataforma ideal</label>
          <div className="flex items-center gap-2 bg-cream/50 rounded-2xl px-4 py-3 border border-sand">
            <span className="text-xl">{PLATFORM_ICONS[form.plataforma_ideal] || '🛒'}</span>
            <span className="text-sm font-bold text-primary capitalize">{form.plataforma_ideal}</span>
            <span className="text-xs text-muted ml-auto">sugerido por IA</span>
          </div>
        </div>
      </div>

      {/* Advertencias */}
      {form.advertencias.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">⚠️ Verificar antes de publicar</p>
          <ul className="space-y-1.5">
            {form.advertencias.map((w, i) => (
              <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 bg-cream border border-sand text-primary py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-sand transition-all"
        >
          ← Analizar otra
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-primary text-cream py-4 rounded-2xl text-sm font-bold uppercase tracking-widest 
                     hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20
                     disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Publicando...
            </>
          ) : (
            'Guardar y Publicar →'
          )}
        </button>
      </div>
    </div>
  );
};
