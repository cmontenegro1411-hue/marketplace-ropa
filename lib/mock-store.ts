/**
 * Simple in-memory mock store to simulate a database.
 * This will be replaced by a real database (Supabase/Prisma) in the next phase.
 */

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  condition: string;
  description: string;
  price: number;
  userId: string;
  createdAt: string;
}

// In-memory array (persists as long as the server process is running)
const MOCK_DB: Product[] = [];

export const mockDb = {
  products: {
    create: async (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
      const newProduct: Product = {
        ...data,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString()
      };
      MOCK_DB.push(newProduct);
      return newProduct;
    },
    list: async (): Promise<Product[]> => {
      return [...MOCK_DB];
    },
    getById: async (id: string): Promise<Product | undefined> => {
      return MOCK_DB.find(p => p.id === id);
    }
  }
};
