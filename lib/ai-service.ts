/**
 * Mock AI Vision Service
 * Simulates the extraction of attributes from a fashion image.
 */

export interface AIAttributes {
  title: string;
  brand: string;
  category: string;
  suggestedPrice: number;
  confidence: number;
}

export const analyzeProductImage = async (_imageFile: File | string): Promise<AIAttributes> => {
  // Simulating network delay for AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock results based on the "Nike" theme we've been using,
  // in a real app this would call OpenAI Vision or Google Cloud Vision.
  return {
    title: "Nike Air Max 270 (Azul/Blanco)",
    brand: "Nike",
    category: "Calzado",
    suggestedPrice: 95.00,
    confidence: 0.98
  };
};

export const generateDescription = async (attributes: Partial<AIAttributes>): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return `Este par de ${attributes.brand} en categoría ${attributes.category} está en excelentes condiciones. Un clásico moderno ideal para cualquier ocasión.`;
};
