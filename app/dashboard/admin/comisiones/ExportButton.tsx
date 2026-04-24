'use client';

import { Download } from "lucide-react";

interface ExportButtonProps {
  data: any[];
}

export default function ExportButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Headers
    const headers = ["ID", "Fecha", "Monto", "Tipo", "Usuario", "Email", "Referencia"];
    
    // Rows
    const rows = data.map(r => [
      r.id,
      new Date(r.created_at).toLocaleString(),
      r.amount,
      r.type,
      r.users?.name || 'N/A',
      r.users?.email || 'N/A',
      r.reference_id
    ]);

    // CSV Construction
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    // Download Logic
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `comisiones_plataforma_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="flex items-center gap-3 px-6 py-3 bg-white border border-sand/50 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Download className="w-4 h-4 text-primary" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Exportar Reporte</span>
    </button>
  );
}
