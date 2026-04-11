'use client';

import React, { useState } from 'react';
import { deleteListing } from "@/app/actions/product-actions";

interface DeleteListingButtonProps {
  productId: string;
  title: string;
}

export const DeleteListingButton: React.FC<DeleteListingButtonProps> = ({ productId, title }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar navegar al detalle
    e.stopPropagation();

    if (!confirm(`¿Estás seguro de que quieres eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteListing(productId);

    if (result.success) {
      // La página se refrescará automáticamente gracias a revalidatePath
    } else {
      alert("Error al eliminar: " + result.error);
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-all z-20 group/del"
      title="Eliminar publicación"
    >
      {isDeleting ? (
        <div className="w-4 h-4 border-2 border-secondary animate-spin rounded-full border-t-transparent group-hover/del:border-white"></div>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      )}
    </button>
  );
};
