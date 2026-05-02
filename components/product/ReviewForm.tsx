'use client';

import { useState } from 'react';
import { createSellerReview } from '@/app/actions/reputation-actions';
import { toast } from 'sonner';

interface ReviewFormProps {
  sellerId: string;
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ sellerId, orderId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createSellerReview({
        sellerId,
        orderId,
        rating,
        comment
      });

      if (result.success) {
        toast.success('¡Gracias por tu reseña!');
        onSuccess?.();
      } else {
        toast.error('Error al enviar: ' + result.error);
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-sand/10 p-6 rounded-3xl border border-sand/30 space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-4">
          ¿Qué te pareció el vendedor?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill={star <= rating ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                className={star <= rating ? 'text-secondary' : 'text-sand'}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
          Tu comentario
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuéntanos tu experiencia (opcional)..."
          className="w-full bg-white rounded-2xl p-4 text-sm border border-sand focus:border-primary outline-none min-h-[100px]"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary text-white py-3 rounded-full font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-sand rounded-full font-bold hover:bg-sand/10 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
