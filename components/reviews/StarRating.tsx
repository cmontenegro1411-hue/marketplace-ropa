'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  interactive?: boolean;
}

export function StarRating({ rating, setRating, interactive = true }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`transition-all duration-200 transform ${
            interactive ? "hover:scale-110 active:scale-95 cursor-pointer" : "cursor-default"
          }`}
        >
          <Star
            className={`w-8 h-8 transition-colors duration-200 ${
              (hoverRating || rating) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

