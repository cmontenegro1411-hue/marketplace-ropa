import { createClient } from '@supabase/supabase-js';

const SELLER_ID = "00000000-0000-0000-0000-000000000000";

const dummyProducts = [
  {
    title: "Vestido Midi Floral Vintage",
    description: "Vestido de seda con estampado botánico, perfecto para eventos de tarde. Corte impecable.",
    price: 185,
    brand: "Zara Premium",
    category: "Mujer",
    condition: "Como Nuevo",
    size: "M",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800"]
  },
  {
    title: "Chaqueta de Cuero Biker",
    description: "Cuero auténtico de vacuno de alta calidad. Estilo icónico con herrajes plateados.",
    price: 490,
    brand: "Diesel",
    category: "Hombre",
    condition: "Excelente",
    size: "L",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800"]
  },
  {
    title: "Blazer Lana Virgen Crema",
    description: "Chaqueta estructurada de color crema. Estilo minimalista y sofisticado.",
    price: 220,
    brand: "Massimo Dutti",
    category: "Mujer",
    condition: "Excelente",
    size: "S",
    images: ["https://images.unsplash.com/photo-1548126032-079a0fb0099d?q=80&w=800"]
  },
  {
    title: "Bolso de Piel Acolchado",
    description: "Bolso de hombro en color negro con detalles dorados. Piel legítima ultra suave.",
    price: 350,
    brand: "Purificación García",
    category: "Mujer",
    condition: "Como Nuevo",
    size: "Única",
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800"]
  },
  {
    title: "Reloj Minimalista Classic",
    description: "Correa de cuero café y esfera blanca minimalista. Un accesorio esencial.",
    price: 180,
    brand: "Daniel Wellington",
    category: "Hombre",
    condition: "Excelente",
    size: "Única",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"]
  },
  {
    title: "Gafas de Sol Carey Wayfarer",
    description: "Montura clásica estilo wayfarer en color carey. Lentes con protección UV.",
    price: 290,
    brand: "Ray-Ban",
    category: "Accesorios",
    condition: "Como Nuevo",
    size: "Única",
    images: ["https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=800"]
  }
];

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  console.log("🧹 Limpiando tabla de productos (técnica segura por precio)...");
  // Esta vez borramos todo lo que tenga un precio mayor a -1 (o sea, todo)
  const { error: delError } = await supabase.from('products').delete().gt('price', -1);
  
  if (delError) {
    console.error("❌ Error al limpiar:", delError.message);
    return;
  }

  console.log("🚀 Llenando catálogo premium en Soles...");
  // Quitamos el seller_id de la inserción para que Supabase use el default si existe,
  // pero lo ponemos explícitamente si es necesario.
  const productsToInsert = dummyProducts.map(p => ({ ...p, seller_id: SELLER_ID }));
  const { error: insError } = await supabase.from('products').insert(productsToInsert);
  
  if (insError) {
    console.error("❌ Error al insertar:", insError.message);
  } else {
    console.log("✅ ¡Catálogo reconstruido totalmente! Refresca ahora.");
  }
}

seed();
