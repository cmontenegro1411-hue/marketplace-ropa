'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Home, Mail, ShieldAlert, Loader2 } from 'lucide-react';
import { disputeOrderItem } from '@/app/actions/order-actions';
import Link from 'next/link';

export default function RefundRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<'ready' | 'loading' | 'success' | 'error'>('ready');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setStatus('loading');
    try {
      const result = await disputeOrderItem(token);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'No pudimos procesar la solicitud.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Error de conexión.');
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F1EB] py-20 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-8 border border-sand/50 overflow-hidden relative">
        <div className="text-center">
          {status === 'ready' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              
              <h1 className="text-3xl font-serif text-primary mb-3">Solicitud de Devolución</h1>
              <p className="text-muted text-sm leading-relaxed mb-8 px-4">
                Lamentamos que no estés conforme con tu compra. Al iniciar este proceso, **congelaremos el pago del vendedor** y nuestro equipo de soporte se pondrá en contacto contigo.
              </p>

              <div className="bg-red-50 p-4 rounded-3xl border border-red-100 mb-8 flex items-start gap-3 text-left">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-1">Flujo de Garantía</p>
                  <p className="text-[10px] text-red-800 leading-tight">
                    Una vez iniciada la solicitud, el monto no se liberará al vendedor hasta que se resuelva la disputa. Deberás enviar fotos de la prenda a <span className="font-bold">soporte@modacircular.com</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={status === 'loading'}
                className="w-full py-4 bg-red-600 text-white rounded-full text-sm font-bold uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {status === 'loading' ? <Loader2 className="animate-spin h-5 w-5" /> : 'Bloquear Pago y Notificar'}
              </button>

              {status === 'error' && (
                <p className="mt-4 text-xs text-red-500 font-bold">{errorMsg}</p>
              )}
              
              <Link href="/" className="inline-block mt-6 text-xs text-muted hover:text-primary transition-colors uppercase tracking-widest">
                Cancelar y Volver
              </Link>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-in zoom-in fade-in duration-500">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-12 h-12 text-red-600" />
              </div>
              
              <h2 className="text-3xl font-serif text-primary mb-3">Solicitud Enviada</h2>
              <p className="text-muted text-sm leading-relaxed mb-10 px-4">
                Hemos bloqueado la liberación de fondos para esta prenda. Por favor, revisa tu correo electrónico con las instrucciones para proceder con la devolución física y el reembolso.
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
        </div>
      </div>
    </main>
  );
}
