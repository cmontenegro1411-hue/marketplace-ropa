'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import { submitProductReview } from '@/app/actions/product-actions';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  token: string;
  productName?: string;
}

export function ReviewForm({ productId, token, productName }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Por favor selecciona una calificación.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitProductReview({
        productId,
        rating,
        comment,
        token
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Ocurrió un error al enviar la reseña.');
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">¡Gracias por tu opinión!</h3>
        <p className="text-green-700">Tu reseña nos ayuda a construir una comunidad más confiable.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Califica tu compra</h3>
      <p className="text-sm text-gray-500 mb-6">
        ¿Qué te pareció {productName ? <strong>{productName}</strong> : 'el producto'}? Tu opinión es muy valiosa para el vendedor y otros compradores.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center py-2">
          <StarRating rating={rating} setRating={setRating} />
          {rating > 0 && (
            <span className="text-sm font-medium text-yellow-600 mt-2">
              {rating === 1 && 'Muy malo'}
              {rating === 2 && 'Regular'}
              {rating === 3 && 'Bueno'}
              {rating === 4 && 'Muy bueno'}
              {rating === 5 && '¡Excelente!'}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Comentario (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos más sobre la prenda, el estado, el envío..."
            className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2 group"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              Publicar Calificación
            </>
          )}
        </button>
      </form>
    </div>
  );
}
