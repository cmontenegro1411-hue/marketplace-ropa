import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image View */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white border border-sand group cursor-zoom-in">
        <div className="w-full h-full bg-gradient-to-br from-sand to-cream flex items-center justify-center">
          <span className="text-muted/20 font-serif italic text-2xl">Luxury Detail Image {selectedImage + 1}</span>
        </div>
        
        {/* Navigation Arrows (Mobile hidden) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : images.length - 1))}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={() => setSelectedImage(prev => (prev < images.length - 1 ? prev + 1 : 0))}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(idx)}
            className={`flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
              selectedImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <div className="w-full h-full bg-sand" />
          </button>
        ))}
      </div>
    </div>
  );
};
