'use client';

import React, { useState } from 'react';
import { Container } from "@/components/ui/Container";
import { Navbar } from "@/components/ui/Navbar";
import Link from 'next/link';

// Datos de simulación para los reportes de ventas
const mockSalesData = [
  { id: 'ORD-001', date: '2023-11-20', item: 'Casaca Denim Vintage', price: 120.00, status: 'Completado', image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=200' },
  { id: 'ORD-002', date: '2023-11-15', item: 'Vestido Floral Zara', price: 85.00, status: 'En Tránsito', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=200' },
  { id: 'ORD-003', date: '2023-10-30', item: 'Zapatillas Converse High', price: 150.00, status: 'Completado', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=200' },
];

export default function SettingsAndReportsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'security' | 'payments'>('reports');

  const totalEarnings = mockSalesData.reduce((acc, curr) => acc + curr.price, 0);
  const totalItemsSold = mockSalesData.length;

  return (
    <div className="min-h-screen bg-sand/30 pb-20">
      <Navbar />
      
      <Container className="py-12 max-w-5xl">
        <header className="mb-10">
          <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors mb-6 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6"/></svg>
            Volver a Mi Closet
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-primary mb-2">Panel de Control</h1>
              <p className="text-muted italic">Tus ventas, configuración y análisis en un solo lugar.</p>
            </div>
          </div>
        </header>

        {/* Custom Tabs */}
        <div className="flex gap-4 border-b border-sand mb-8 overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
          >
            Reporte de Ventas
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`whitespace-nowrap pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
          >
            Métodos de Cobro
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`whitespace-nowrap pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'security' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
          >
            Seguridad & Alertas
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-sand min-h-[500px]">
          
          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-10 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-primary">Resumen General</h2>
                <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                  Estado: Saludable
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border border-sand shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Total Ingresos</p>
                  <p className="text-4xl font-serif font-bold text-primary">S/ {totalEarnings.toFixed(2)}</p>
                  <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                    +12% este mes
                  </p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border border-sand shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Prendas Vendidas</p>
                  <p className="text-4xl font-serif font-bold text-primary">{totalItemsSold}</p>
                  <p className="text-xs text-muted mt-2">De 15 publicadas</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-white to-sand/20 rounded-3xl border border-sand shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Próximo Pago</p>
                  <p className="text-3xl font-serif font-bold text-secondary mt-1">S/ 85.00</p>
                  <p className="text-xs text-muted mt-2">Estimado: Viernes 24</p>
                </div>
              </div>

              {/* Sales History */}
              <div className="pt-8">
                <h3 className="text-lg font-serif font-bold text-primary border-b border-sand pb-4 mb-6">Historial de Prendas Vendidas</h3>
                
                <div className="space-y-4">
                  {mockSalesData.map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-sand/20 rounded-2xl transition-colors border border-transparent hover:border-sand/50">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <img src={order.image} alt={order.item} className="w-16 h-16 rounded-xl object-cover bg-sand shadow-sm" />
                        <div>
                          <p className="font-bold text-primary">{order.item}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-widest text-muted">ID: {order.id}</span>
                            <span className="text-muted">•</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted">{order.date}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                        <span className="text-lg font-serif font-bold text-primary">S/ {order.price.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${order.status === 'Completado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PAYMENTS TAB (Placeholder) */}
          {activeTab === 'payments' && (
            <div className="py-16 text-center animate-fade-in">
              <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-2">Tus Ganancias</h2>
              <p className="text-muted max-w-md mx-auto mb-8">
                Próximamente podrás vincular tu cuenta bancaria o Yape/Plin para recibir el dinero de tus ventas de manera automática.
              </p>
              <button disabled className="px-6 py-3 bg-sand text-muted font-bold rounded-full cursor-not-allowed">
                Vincular Cuenta (Muy pronto)
              </button>
            </div>
          )}

          {/* SECURITY TAB (Placeholder) */}
          {activeTab === 'security' && (
            <div className="py-16 text-center animate-fade-in">
              <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-2">Seguridad de la Cuenta</h2>
              <p className="text-muted max-w-md mx-auto">
                Aquí podrás cambiar tu contraseña, configurar la autenticación en dos pasos y gestionar tus notificaciones por email.
              </p>
            </div>
          )}

        </div>
      </Container>
    </div>
  );
}
