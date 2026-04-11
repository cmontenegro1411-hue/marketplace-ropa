import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan las variables de entorno de Supabase.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyProducts = [
  // MUJER
  {
    title: "Vestido Midi Floral Vintage",
    description: "Vestido de seda con estampado botánico, perfecto para eventos de tarde. Corte impecable.",
    price: 85000,
    brand: "Zara Premium",
    category: "Mujer",
    condition: "Como Nuevo",
    size: "M",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800"],
    status: "available"
  },
  {
    title: "Blazer Lana Virgen",
    description: "Chaqueta estructurada de color crema. Un básico atemporal para un look profesional.",
    price: 120000,
    brand: "Massimo Dutti",
    category: "Mujer",
    condition: "Excelente",
    size: "S",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800"],
    status: "available"
  },
  {
    title: "Bolso de Piel Acolchado",
    description: "Bolso de hombro en color negro con detalles dorados. Piel legítima muy cuidada.",
    price: 250000,
    brand: "Purificación García",
    category: "Mujer",
    condition: "Como Nuevo",
    size: "Única",
    images: ["https://images.unsplash.com/photo-1584917033904-47e24ec1583b?q=80&w=800"],
    status: "available"
  },
  
  // HOMBRE
  {
    title: "Chaqueta Cuero Biker",
    description: "Cuero auténtico de vacuno. Estilo rebelde con cremalleras metálicas. Muy poco uso.",
    price: 450000,
    brand: "Diesel",
    category: "Hombre",
    condition: "Excelente",
    size: "L",
    images: ["https://images.unsplash.com/photo-1521223890158-f9f7c3d5d50d?q=80&w=800"],
    status: "available"
  },
  {
    title: "Camisa Lino Orgánico",
    description: "Camisa fresca ideal para climas cálidos. Color azul cielo con botones de madera.",
    price: 65000,
    brand: "Banana Republic",
    category: "Hombre",
    condition: "Nuevo con etiquetas",
    size: "XL",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800"],
    status: "available"
  },
  {
    title: "Reloj Minimalista Classic",
    description: "Correa de cuero café y esfera blanca. Elegancia discreta para el día a día.",
    price: 180000,
    brand: "Daniel Wellington",
    category: "Hombre",
    condition: "Excelente",
    size: "Única",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"],
    status: "available"
  },

  // ACCESORIOS Y OTROS
  {
    title: "Gafas de Sol Carey",
    description: "Montura clásica estilo wayfarer en color carey. Lentes con protección UV total.",
    price: 95000,
    brand: "Ray-Ban",
    category: "Accesorios",
    condition: "Como Nuevo",
    size: "Única",
    images: ["https://images.unsplash.com/photo-1511499767390-a73350266627?q=80&w=800"],
    status: "available"
  },
  {
    title: "Cinturón de Piel Grabada",
    description: "Hebilla plateada de alta calidad. Piel color chocolate.",
    price: 45000,
    brand: "Boss",
    category: "Accesorios",
    condition: "Bueno",
    size: "34",
    images: ["https://images.unsplash.com/photo-1624222247344-550fb8ecf73d?q=80&w=800"],
    status: "available"
  },
  {
    title: "Bufanda de Cachemira",
    description: "Tacto ultra suave. Color gris carbón. Ideal para el invierno.",
    price: 110000,
    brand: "Burberry",
    category: "Mujer",
    condition: "Excelente",
    size: "Única",
    images: ["https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=800"],
    status: "available"
  }
];

async function seed() {
  console.log("🚀 Iniciando el poblado de la tienda...");
  
  for (const product of dummyProducts) {
    // Intentar insertar los productos uno a uno
    const { error } = await supabase.from('products').insert([product]);
    if (error) {
      console.error(`❌ Error insertando ${product.title}:`, error.message);
    } else {
      console.log(`✅ ${product.title} añadido.`);
    }
  }
  
  console.log("✨ Catálogo actualizado con éxito.");
}

seed();
