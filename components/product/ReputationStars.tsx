import React from 'react';

interface ReputationStarsProps {
  rating: number;
  showCount?: boolean;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ReputationStars: React.FC<ReputationStarsProps> = ({ 
  rating, 
  showCount = false, 
  count = 0,
  size = 'sm'
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const currentSize = starSizes[size];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          const isFull = i < fullStars;
          const isHalf = i === fullStars && hasHalfStar;
          
          return (
            <svg 
              key={i} 
              className={`${currentSize} ${isFull || isHalf ? 'text-secondary' : 'text-sand'}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={isFull ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              {isHalf && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                  </linearGradient>
                </defs>
              )}
            </svg>
          );
        })}
      </div>
      {showCount && (
        <span className="text-xs font-bold text-muted">
          {rating.toFixed(1)} <span className="font-normal opacity-60">({count} reseñas)</span>
        </span>
      )}
    </div>
  );
};
