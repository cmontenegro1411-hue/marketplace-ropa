'use client';

import { useState } from 'react';
import { UbigeoSelector } from '@/components/ui/UbigeoSelector';
import { updateSellerLocation } from '@/app/actions/shipping-actions';
import { toast } from 'sonner';

interface SellerLocationFormProps {
  currentUbigeo?: string;
  currentAddress?: string;
  currentRates?: {
    local: number;
    regional: number;
    national: number;
  };
}

export function SellerLocationForm({ currentUbigeo, currentAddress, currentRates }: SellerLocationFormProps) {
  const [selectedUbigeo, setSelectedUbigeo] = useState(currentUbigeo || '');
  const [address, setAddress] = useState(currentAddress || '');
  const [rates, setRates] = useState({
    local: currentRates?.local ?? 10,
    regional: currentRates?.regional ?? 15,
    national: currentRates?.national ?? 25,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedUbigeo) {
      toast.error('Por favor selecciona una ubicación completa');
      return;
    }

    // Address is now optional for security

    setIsSaving(true);
    try {
      const result = await updateSellerLocation(selectedUbigeo, address, rates);
      if (result.success) {
        toast.success('Configuración de tienda actualizada correctamente');
      } else {
        toast.error('Error al actualizar: ' + result.error);
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-sand/30 space-y-8">
      <div>
        <h3 className="text-2xl font-serif font-bold text-primary mb-2">Ubicación de tu Tienda</h3>
        <p className="text-muted text-sm mb-6 italic">
          Esta información es necesaria para que los compradores sepan desde dónde se envía el producto y calcular el costo de entrega.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2 ml-1">Distrito / Ciudad</label>
            <UbigeoSelector 
              initialUbigeo={currentUbigeo}
              onSelect={(data) => setSelectedUbigeo(data.ubigeoCode)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2 ml-1">Dirección Exacta (Opcional)</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Solo si deseas que el comprador vea tu punto de recojo"
              className="w-full px-4 py-3 rounded-2xl border border-sand focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-sand/10"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-sand">
        <h3 className="text-xl font-serif font-bold text-primary mb-2">Tarifas de Envío (S/)</h3>
        <p className="text-muted text-sm mb-6">Define cuánto cobrarás por el envío según el destino.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-1">Local (Distrito)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">S/</span>
              <input 
                type="number" 
                value={rates.local}
                onChange={(e) => setRates({...rates, local: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sand focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-1">Regional (Dpto.)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">S/</span>
              <input 
                type="number" 
                value={rates.regional}
                onChange={(e) => setRates({...rates, regional: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sand focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-1">Nacional (País)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">S/</span>
              <input 
                type="number" 
                value={rates.national}
                onChange={(e) => setRates({...rates, national: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sand focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios de Tienda'}
        </button>
      </div>
    </div>
  );
}
