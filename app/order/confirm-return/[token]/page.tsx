'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, PackageSearch, ShieldCheck, AlertCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { confirmReturnAndRefund } from '@/app/actions/order-actions';
import Link from 'next/link';

export default function ConfirmReturnPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'ready' | 'loading' | 'success' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState('');

  const handleConfirm = async () => {
    setIsProcessing(true);
    setStatus('loading');
    
    try {
      const result = await confirmReturnAndRefund(token);
      
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'No pudimos validar la recepción del retorno.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Error de conexión con la plataforma.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F1EB] py-20 px-4 flex items-center justify-center font-sans text-[#1a1a1a]">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-8 border border-sand/50 overflow-hidden relative">
        {/* Decoración */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />

        <div className="relative z-10 text-center">
          {status === 'ready' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <PackageSearch className="w-10 h-10 text-primary" />
              </div>
              
              <h1 className="text-3xl font-serif text-primary mb-3">Retorno de Prenda</h1>
              <p className="text-muted text-sm leading-relaxed mb-8 px-4">
                Hola. Si ya tienes la prenda de vuelta y has verificado su estado, por favor confirma la recepción para proceder con el reembolso al comprador.
              </p>

              <div className="bg-sand/20 p-5 rounded-3xl border border-sand mb-8 text-left">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">Confirmación de Vendedor</p>
                    <p className="text-[10px] text-muted leading-tight">
                      Al confirmar, se autorizará a **Mercado Pago** para devolver el dinero al comprador de forma automática. Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full py-4 bg-primary text-cream rounded-full text-sm font-bold uppercase tracking-widest shadow-xl hover:bg-primary/90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando Reembolso...
                  </>
                ) : (
                  <>
                    Confirmar Recepción de Retorno
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <Link href="/profile" className="inline-block mt-6 text-xs text-muted hover:text-primary transition-colors uppercase tracking-widest">
                Volver a mi panel
              </Link>
            </div>
          )}

          {status === 'loading' && (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
              <p className="text-primary font-serif italic text-xl">Ejecutando reembolso...</p>
              <p className="text-[10px] text-muted mt-2 uppercase tracking-widest">Conectando con Mercado Pago</p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-in zoom-in fade-in duration-500 text-[#2F3C2C]">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-serif text-primary mb-3">Retorno Finalizado</h2>
              <p className="text-muted text-sm leading-relaxed mb-10 px-4">
                Has confirmado la recepción de la prenda. Hemos procedido a solicitar el reembolso a Mercado Pago. El comprador verá reflejado su dinero en su cuenta pronto.
              </p>

              <div className="space-y-4">
                <Link 
                  href="/"
                  className="w-full py-4 bg-primary text-cream rounded-full text-sm font-bold uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Ir al Inicio
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-serif text-primary mb-3">Hubo un problema</h2>
              <p className="text-red-600 text-sm mb-8 px-4 font-medium">
                {errorMessage}
              </p>

              <button
                onClick={() => setStatus('ready')}
                className="w-full py-4 bg-primary text-cream rounded-full text-sm font-bold uppercase tracking-widest hover:bg-primary/90"
              >
                Reintentar Confirmación
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
