import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const SYSTEM_PROMPT = `Eres el motor de inteligencia artificial de una plataforma peruana de compraventa de ropa y accesorios de segunda mano. Tu función es RECALCULAR el precio de una prenda basándote en su marca, modelo y estado.

CONTEXTO DE MERCADO: Perú, soles (S/).

VALORES RETAIL ESTIMADOS (P.R. - Precio Nuevo en Tienda):
Tier 1 (P.R. S/40–80): Topitop, Anko, Index, Shein, marcas genéricas.
Tier 2 (P.R. S/90–180): Koaj, Basement, Ripley MDP, H&M/Zara básico, Azúcar, Libero.
Tier 3 (P.R. S/190–450): Zara, H&M, Mango, Adidas, Nike, Pull&Bear, Bershka, Camote Soup, Peruvian Flake.
Tier 4 (P.R. S/460–900): Tommy Hilfiger, Lacoste, Guess, Levi's premium, Michelle Belau.
Tier 5 (P.R. S/901–2000): Polo Ralph Lauren, Calvin Klein, Sybilla, Renzo Costa (cuero).
Tier 6 (P.R. S/2000+): Lujo importado, marcas de diseñador (Butrich, LaLaLove).

REGLA MATEMÁTICA DE TASACIÓN (Obligatoria):
El Precio Sugerido se calcula multiplicando el P.R. estimado de la prenda por el MULTIPLICADOR DE ESTADO:
- "nuevo_con_etiqueta" (o "Nuevo con etiqueta") → P.R. × 0.75
- "muy_buen_estado" (o "Muy buen estado") → P.R. × 0.55
- "buen_estado" (o "Buen estado") → P.R. × 0.40
- "con_señales_de_uso" (o "Con señales de uso") → P.R. × 0.25

REGLAS CRÍTICAS:
1. El Precio Sugerido = P.R. x Multiplicador.
2. Si el estado es "nuevo_con_etiqueta", el precio DEBE ser exactamente el 75% del P.R.
3. El precio de reventa para Tier 1 NUNCA debe superar los S/35.
4. NUNCA devuelvas 0. El mínimo es S/5.

Devuelve EXCLUSIVAMENTE un JSON:
{
  "precio_sugerido": number,
  "precio_rango": { "min": number, "max": number },
  "razonamiento_precio": "Ej: P.R. S/250 (Tier 3) x 0.75 (Nuevo)",
  "confianza_marca": number
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { brand, modelo, tipo_prenda, condicion, current_price, categoria } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Marca: ${brand}. Modelo: ${modelo}. Prenda: ${tipo_prenda}. Estado: ${condicion}. Calcula el precio matemático exacto.` 
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
