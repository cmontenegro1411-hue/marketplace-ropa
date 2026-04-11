'use client';

import React from 'react';
import Link from 'next/link';

interface EditListingLinkProps {
  productId: string;
}

export const EditListingLink: React.FC<EditListingLinkProps> = ({ productId }) => {
  return (
    <Link 
      href={`/dashboard/edit/${productId}`}
      onClick={(e) => e.stopPropagation()} // Evitar navegar al detalle si se envuelve en link
      className="absolute bottom-3 right-12 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-20 group/edit"
      title="Editar publicación"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
    </Link>
  );
};
