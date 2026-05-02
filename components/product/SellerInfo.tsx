import React from 'react';
import { ReputationStars } from './ReputationStars';
import Link from 'next/link';

interface SellerInfoProps {
  name: string;
  rating: number;
  salesCount: number;
  isVerified?: boolean;
  location: string;
  hasReviews?: boolean;
  sellerId?: string;
}

export const SellerInfo: React.FC<SellerInfoProps> = ({
  name,
  rating,
  salesCount,
  isVerified,
  location,
  hasReviews,
  sellerId
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-sand shadow-sm hover:shadow-md transition-shadow text-left">
      <div className="flex items-center gap-4 mb-6 text-left">
        <div className="w-14 h-14 rounded-full bg-sand flex items-center justify-center text-primary font-serif font-bold text-xl flex-shrink-0">
          {name.charAt(0)}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-lg leading-tight">{name}</h4>
            {isVerified && (
              <span className="text-primary flex-shrink-0" title="Vendedor Verificado">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-primary"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
              </span>
            )}
          </div>
          <div className="mt-1">
            <ReputationStars rating={rating} showCount count={salesCount} />
          </div>
        </div>
      </div>
      
      <div className="space-y-4 pt-4 border-t border-sand">
        <div className="flex items-center gap-3 text-sm text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>Desde: <strong className="text-foreground">{location}</strong></span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Tiempo de respuesta: <strong className="text-foreground">~2 horas</strong></span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {sellerId ? (
          <Link 
            href={`/search?seller=${sellerId}`}
            className="block w-full py-3 border border-primary text-primary font-bold rounded-full hover:bg-primary/5 transition-colors text-sm text-center"
          >
            Explorar todo el Closet
          </Link>
        ) : (
          <button 
            disabled
            className="block w-full py-3 border border-sand text-muted font-bold rounded-full cursor-not-allowed text-sm text-center"
          >
            Closet no disponible
          </button>
        )}
        
        {hasReviews && (
          <a 
            href="#reviews" 
            className="block text-center text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors py-1 animate-pulse hover:animate-none"
          >
            Leer reseñas de la comunidad ↓
          </a>
        )}
      </div>
    </div>
  );
};
