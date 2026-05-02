'use client';

import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const handleImageError = (idx: number) => {
    setImageError(prev => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image View */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white border border-sand group cursor-zoom-in shadow-sm">
        {images && images.length > 0 && !imageError[selectedImage] ? (
          <img 
            src={images[selectedImage]} 
            alt={`Vista del producto ${selectedImage + 1}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => handleImageError(selectedImage)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sand to-cream flex flex-col items-center justify-center p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted/30 mb-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span className="text-muted/40 font-serif italic text-lg">Imagen no disponible</span>
          </div>
        )}
        
        {/* Navigation Arrows (Mobile hidden) */}
        {images && images.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(prev => (prev > 0 ? prev - 1 : images.length - 1));
              }}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white shadow-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(prev => (prev < images.length - 1 ? prev + 1 : 0));
              }}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white shadow-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {images && images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(idx)}
            className={`flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
              selectedImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            {!imageError[idx] ? (
              <img 
                src={img} 
                alt={`Miniatura ${idx + 1}`} 
                className="w-full h-full object-cover"
                onError={() => handleImageError(idx)}
              />
            ) : (
              <div className="w-full h-full bg-sand/50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/30"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
