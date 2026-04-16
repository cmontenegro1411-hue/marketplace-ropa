'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { PhotoUploader } from '@/components/ai-listing/PhotoUploader';
import { ListingResult, type AIResult } from '@/components/ai-listing/ListingResult';
import Link from 'next/link';

type PageState = 'idle' | 'analyzing' | 'result' | 'error';

interface CreditInfo {
  credits_remaining: number;
  credits_total: number;
  plan: string;
}

export default function AIListingPage() {
  const [pageState, setPageState] = useState<PageState>('idle');
  const [result, setResult] = useState<AIResult | null>(null);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * Convierte un File a base64 string (sin el prefijo data:...)
   */
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Remover "data:image/...;base64,"
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAnalyze = async (file: File) => {
    setImageFile(file);
    setPageState('analyzing');
    setErrorMessage('');

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/listings/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: file.type }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || `Error ${response.status}`);
      }

      setResult(json.data as AIResult);
      setCredits(json.credits as CreditInfo);
      setPageState('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMessage(msg);
      setPageState('error');
    }
  };

  const handleReset = () => {
    setPageState('idle');
    setResult(null);
    setImageFile(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-sand/20 py-10">
      <Container className="max-w-2xl">

        {/* Header */}
        <header className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors mb-5 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Mi Closet
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-primary mb-1">
                ✨ Generador IA
              </h1>
              <p className="text-sm text-muted">
                Subí una foto y la IA completa el listado por vos
              </p>
            </div>

            {/* Credits badge */}
            {credits && (
              <div className={`rounded-2xl px-4 py-3 text-center border flex-shrink-0
                ${credits.credits_remaining === 0
                  ? 'bg-secondary/10 border-secondary/30'
                  : credits.credits_remaining <= Math.floor(credits.credits_total * 0.3)
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-primary/8 border-primary/20'}`}
              >
                <p className={`text-lg font-serif font-bold
                  ${credits.credits_remaining === 0 ? 'text-secondary' : 'text-primary'}`}
                >
                  {credits.plan === 'unlimited' ? '∞' : credits.credits_remaining}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  créditos
                </p>
              </div>
            )}
          </div>

          {/* How it works - only on idle */}
          {pageState === 'idle' && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { step: '1', icon: '📸', label: 'Subí la foto' },
                { step: '2', icon: '🤖', label: 'La IA analiza' },
                { step: '3', icon: '✏️', label: 'Editá y publicá' },
              ].map(({ step, icon, label }) => (
                <div key={step} className="bg-white rounded-2xl p-4 text-center border border-sand">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-2">{label}</p>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Main content */}
        <main>
          {(pageState === 'idle' || pageState === 'analyzing') && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand">
              <PhotoUploader
                onAnalyze={handleAnalyze}
                isAnalyzing={pageState === 'analyzing'}
              />
            </div>
          )}

          {/* Analyzing skeleton */}
          {pageState === 'analyzing' && (
            <div className="mt-4 space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-2xl border border-sand" />
              ))}
            </div>
          )}

          {/* Error state */}
          {pageState === 'error' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sand text-center space-y-5">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-primary mb-2">
                  Error en el análisis
                </h2>
                <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="bg-primary text-cream px-8 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Result */}
          {pageState === 'result' && result && imageFile && (
            <ListingResult
              result={result}
              imageFile={imageFile}
              onReset={handleReset}
            />
          )}
        </main>

        {/* Footer note */}
        <p className="text-center text-[11px] text-muted mt-8">
          Plan Free: 10 créditos/mes · Cada análisis consume 1 crédito
        </p>
      </Container>
    </div>
  );
}
