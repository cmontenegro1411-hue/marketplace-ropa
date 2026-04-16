import React from 'react';
import { Container } from "@/components/ui/Container";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Usamos admin client porque esto es sólo para lectura interna y bypass de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function AIHistoryDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Solo el Admin puede ver este panel
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    redirect('/profile');
  }

  // Traer historial de todos los usuarios en la plataforma
  const { data: logs, error } = await supabaseAdmin
    .from('ai_generations_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("Error fetching AI logs:", error);

  const validLogs = logs || [];
  
  // Métricas Calculadas
  const totalGenerations = validLogs.length;
  const successful = validLogs.filter(l => l.success).length;
  const failed = totalGenerations - successful;
  const totalCost = validLogs.reduce((sum, l) => sum + (l.cost_usd || 0), 0);
  const successRate = totalGenerations > 0 ? Math.round((successful / totalGenerations) * 100) : 0;
  
  const avgCostPerRun = totalGenerations > 0 ? (totalCost / totalGenerations) : 0;

  return (
    <div className="min-h-screen bg-[#FBF9F6] pt-32 pb-24">
      <Container>
        <div className="mb-12">
          <div className="inline-block px-4 py-1.5 border border-accent/20 rounded-full mb-4 bg-white">
             <span className="text-secondary font-bold tracking-[0.5em] uppercase text-[9px]">Centro de Control</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight mb-4">
            Auditoría de Inteligencia Artificial
          </h1>
          <p className="text-muted text-lg max-w-2xl">
            Monitorea el uso de los modelos de Visión en tu tienda, valida tasas de éxito y mantén un control preciso sobre el costo del hardware generativo.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-sand shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Total Análisis</p>
            <p className="text-4xl font-serif font-bold text-primary">{totalGenerations}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-sand shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Tasa de Éxito</p>
            <p className="text-4xl font-serif font-bold text-secondary">{successRate}%</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-sand shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Coste Promedio</p>
            <p className="text-4xl font-serif font-bold text-primary">${avgCostPerRun.toFixed(4)}</p>
          </div>
           <div className="bg-primary text-cream p-6 rounded-3xl border border-primary shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Gasto Monetario (USD)</p>
            <p className="text-4xl font-serif font-bold text-accent">${totalCost.toFixed(3)}</p>
            <p className="text-xs mt-2 opacity-60">Consumido en GPT-4o API</p>
          </div>
        </div>

        {/* Tabla Detallada */}
        <div className="bg-white rounded-3xl border border-sand shadow-sm overflow-hidden">
          <div className="p-6 border-b border-sand bg-cream/30">
            <h3 className="font-serif font-bold text-xl text-primary">Historial de Ejecuciones de Visión (Log)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FBF9F6] text-[10px] uppercase tracking-widest text-muted border-b border-sand">
                  <th className="p-5 font-bold">Fecha / Hora</th>
                  <th className="p-5 font-bold">Modelo</th>
                  <th className="p-5 font-bold">Estado</th>
                  <th className="p-5 font-bold text-right">Tokens In</th>
                  <th className="p-5 font-bold text-right">Tokens Out</th>
                  <th className="p-5 font-bold text-right">Costo USD</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {validLogs.length === 0 ? (
                  <tr>
                     <td colSpan={6} className="p-10 text-center text-muted italic">No se ha registrado actividad de Inteligencia Artificial aún.</td>
                  </tr>
                ) : (
                  validLogs.map((log) => (
                    <tr key={log.id} className="border-b border-sand/50 hover:bg-cream/20 transition-colors">
                      <td className="p-5 font-medium text-primary">
                        {new Date(log.created_at).toLocaleString('es-PE', {
                          dateStyle: 'short', timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-5">
                        <span className="bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded text-xs font-bold font-mono">
                          {log.model_used}
                        </span>
                      </td>
                      <td className="p-5">
                        {log.success ? (
                          <span className="flex items-center gap-1.5 text-secondary font-bold text-xs uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span> Exitoso
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-500 font-bold text-xs uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Fallido
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-right font-mono text-muted">{log.tokens_input?.toLocaleString() || '-'}</td>
                      <td className="p-5 text-right font-mono text-muted">{log.tokens_output?.toLocaleString() || '-'}</td>
                      <td className="p-5 text-right font-bold text-primary">${(log.cost_usd || 0).toFixed(4)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
}
