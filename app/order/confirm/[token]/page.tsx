'use client';

import { useState, use } from 'react';
import { CheckCircle2, Package, ShieldCheck, AlertCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { confirmItemReception, getOrderItemStatus } from '@/app/actions/order-actions';
import { useEffect } from 'react';
import Link from 'next/link';
import { ReviewForm } from '@/components/reviews/ReviewForm';

export default function ConfirmReceptionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [product, setProduct] = useState<{ title: string; brand: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [metadata, setMetadata] = useState<{ productId: string; itemId: string; sellerId: string } | null>(null);

  const checkStatus = async () => {
    setStatus('loading');
    try {
      const result = await getOrderItemStatus(token);
      if (result.success) {
        if ('orderItem' in result && result.orderItem) {
          const item = (result as any).orderItem;
          setMetadata({
            productId: item.productId as string,
            itemId: item.id,
            sellerId: item.sellerId as string
          });
        }
        
        if (result.status === 'completed') {
          setStatus('success');
        } else if (result.status === 'pending' || result.status === 'shipped') {
          setStatus('ready');
        } else {
          setStatus('error');
          setErrorMessage(`Este pedido no puede ser confirmado porque su estado actual es: ${result.status}`);
        }
      } else {
        setStatus('error');
        const errorMsg = 'error' in result ? (result as any).error : '';
        setErrorMessage(errorMsg || 'Enlace inválido o expirado.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Error al verificar el estado del pedido.');
    } finally {
      setHasCheckedStatus(true);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [token]);

  const handleConfirm = async () => {
    if (isProcessing || status !== 'ready') return;
    setIsProcessing(true);
    
    try {
      const result = await confirmItemReception(token);
      
      
      if (result.success) {
        if ('orderItem' in result && result.orderItem) {
          const item = (result as any).orderItem;
          setMetadata({
            productId: item.productId as string,
            itemId: item.id,
            sellerId: item.sellerId as string
          });
        }
        setStatus('success');
      } else {
        const errorMsg = 'error' in result ? (result as any).error : '';
        // Si el error es porque ya estaba completado, lo tratamos como éxito
        if (errorMsg?.includes('ya ha sido procesado') || errorMsg?.includes('completed')) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(errorMsg || 'No pudimos procesar la confirmación.');
        }
      }
    } catch (_err) {
      setStatus('error');
      setErrorMessage('Ocurrió un error inesperado.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F1EB] py-20 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-primary/5 p-8 border border-sand/50 overflow-hidden relative">
        {/* Decoración de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 text-center">
          {status === 'ready' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-accent" />
              </div>
              
              <h1 className="text-3xl font-serif text-primary mb-3">Confirmar Recepción</h1>
              
              {product && (
                <div className="mb-6 px-4 py-3 bg-primary/5 rounded-2xl inline-block border border-primary/10">
                  <p className="text-primary font-bold text-sm">{product.brand}</p>
                  <p className="text-muted text-xs italic">{product.title}</p>
                </div>
              )}

              <p className="text-muted text-sm leading-relaxed mb-8 px-4">
                ¿Has recibido tu prenda correctamente? Al confirmar, liberaremos el pago al vendedor.
              </p>

              <div className="bg-sand/20 p-4 rounded-3xl border border-sand mb-8 flex items-start gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-1">Protección al Comprador</p>
                  <p className="text-[10px] text-muted leading-tight">
                    Recuerda revisar el estado de la prenda antes de confirmar. Una vez aceptada, el pago ya no podrá ser retenido.
                  </p>
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
                    Procesando...
                  </>
                ) : (
                  <>
                    Confirmar Recepción
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <Link href="/search" className="inline-block mt-6 text-xs text-muted hover:text-primary transition-colors uppercase tracking-widest">
                Volver al catálogo
              </Link>
            </div>
          )}

          {status === 'loading' && (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-6" />
              <p className="text-primary font-serif italic text-xl">Validando estado...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-in zoom-in fade-in duration-500">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-serif text-primary mb-3">¡Excelente!</h2>
              
              {product && (
                <p className="text-primary font-medium text-sm mb-4">
                  Confirmación de: <br/>
                  <span className="font-bold">{product.brand} {product.title}</span>
                </p>
              )}

              <p className="text-muted text-sm leading-relaxed mb-10 px-4">
                La recepción ha sido confirmada satisfactoriamente. El vendedor recibirá sus fondos pronto. ¡Gracias por circular moda!
              </p>

              <div className="space-y-6">
                {metadata?.productId && (
                  <div className="mt-4 border-t border-gray-100 pt-6 animate-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
                    <ReviewForm 
                      productId={metadata.productId} 
                      token={token} 
                      productName={product ? `${product.brand} ${product.title}` : undefined} 
                    />
                  </div>
                )}

                <Link 
                  href="/"
                  className="w-full py-4 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Ir al Inicio
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-serif text-primary mb-3">Algo salió mal</h2>
              <p className="text-red-600 text-sm mb-8 px-4 font-medium">
                {errorMessage}
              </p>

              <button
                onClick={checkStatus}
                className="w-full py-4 bg-primary text-cream rounded-full text-sm font-bold uppercase tracking-widest hover:bg-primary/90 shadow-lg"
              >
                Verificar estado actual
              </button>
              
              <Link 
                href="/contact"
                className="block mt-6 text-xs text-muted underline uppercase tracking-widest"
              >
                ¿Necesitas ayuda? Contactar soporte
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30 select-none">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Moda Circular Luxury</span>
      </div>
    </main>
  );
}
