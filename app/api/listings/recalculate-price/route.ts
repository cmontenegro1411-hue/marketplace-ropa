import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const SYSTEM_PROMPT = `Eres el motor de inteligencia artificial de una plataforma peruana de compraventa de ropa y accesorios de segunda mano. Tu función es ESTIMAR el precio original de tienda (Retail) de una prenda basándote en su marca, modelo y categoría.

CONTEXTO DE MERCADO: Perú, soles (S/).

VALORES RETAIL ESTIMADOS (P.R. - Precio Nuevo en Tienda):
Tier 1 (P.R. S/40–80): Topitop, Anko, Index, Shein, marcas genéricas.
Tier 2 (P.R. S/90–180): Koaj, Basement, Ripley MDP, H&M/Zara básico, Azúcar, Libero.
Tier 3 (P.R. S/190–450): Zara, H&M, Mango, Adidas, Nike, Pull&Bear, Bershka, Camote Soup, Peruvian Flake.
Tier 4 (P.R. S/460–900): Tommy Hilfiger, Lacoste, Guess, Levi's premium, Michelle Belau.
Tier 5 (P.R. S/901–2000): Polo Ralph Lauren, Calvin Klein, Sybilla, Renzo Costa (cuero).
Tier 6 (P.R. S/2000+): Lujo importado, marcas de diseñador (Butrich, LaLaLove).

REGLA CRÍTICA:
- Solo estima el precio RETAIL (P.R.). No apliques descuentos por estado.
- Si es una marca de Tier 1, el P.R. no suele superar los S/80.

Devuelve EXCLUSIVAMENTE un JSON:
{
  "precio_retail_estimado": number,
  "razonamiento": "string",
  "confianza_marca": number
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { brand, modelo, tipo_prenda, categoria } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Marca: ${brand}. Modelo: ${modelo}. Prenda: ${tipo_prenda}. Categoría: ${categoria}. Estima el precio Retail (nuevo en tienda) en soles peruanos.` 
        }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Sin respuesta');

    return NextResponse.json({ success: true, data: JSON.parse(content) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
