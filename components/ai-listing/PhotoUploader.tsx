'use client';

import React, { useState, useRef, useCallback } from 'react';

interface PhotoUploaderProps {
  onAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
}

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const PhotoUploader = ({ onAnalyze, isAnalyzing }: PhotoUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Solo se aceptan imágenes JPG, PNG o WEBP.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_SIZE_MB}MB.`);
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleReset = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleAnalyze = () => {
    if (file) onAnalyze(file);
  };

  return (
    <div className="w-full space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-sand hover:border-primary/40 hover:bg-cream/30'}
          ${preview ? 'border-solid border-sand' : ''}
        `}
      >
        {preview ? (
          /* Preview state */
          <div className="relative aspect-[4/3] sm:aspect-video">
            <img
              src={preview}
              alt="Prenda a analizar"
              className="w-full h-full object-contain bg-cream/50"
            />
            {/* Overlay controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
              <div className="flex items-center gap-2 w-full">
                <span className="text-white/90 text-xs font-medium truncate flex-1">
                  {file?.name}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors flex-shrink-0"
                >
                  Cambiar
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / upload state */
          <label className="flex flex-col items-center justify-center gap-5 p-12 cursor-pointer">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Icon */}
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-transform
                ${isDragging ? 'scale-110 bg-primary/15' : 'bg-cream'}`}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-primary mb-1">
                {isDragging ? 'Soltá aquí la imagen' : 'Arrastrá o tocá para subir'}
              </p>
              <p className="text-xs text-muted">JPG, PNG o WEBP — máximo {MAX_SIZE_MB}MB</p>
            </div>
          </label>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-xs text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Analyze button */}
      {preview && !isAnalyzing && (
        <button
          onClick={handleAnalyze}
          disabled={!file}
          className="w-full bg-primary text-cream py-4 rounded-2xl text-sm font-bold uppercase tracking-widest 
                     hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <span>✨</span>
          <span>Analizar con IA</span>
        </button>
      )}

      {/* Analyzing state */}
      {isAnalyzing && (
        <div className="w-full bg-primary text-cream py-4 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span>Analizando prenda...</span>
        </div>
      )}

      {/* Tip */}
      {!preview && (
        <p className="text-center text-[11px] text-muted">
          💡 Foto con buena luz sobre fondo neutro = mejor análisis
        </p>
      )}
    </div>
  );
};
