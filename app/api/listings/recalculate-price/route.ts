import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const SYSTEM_PROMPT = `Eres el motor de inteligencia artificial de una plataforma peruana de compraventa de ropa y accesorios de segunda mano. Tu función es recalculer el precio de una prenda basándote en su marca, modelo y estado.

CONTEXTO DE MERCADO: Perú, soles (S/).

CONOCIMIENTO DE MARCAS Y TIERS (MERCADO PERUANO):
Tier 1 (S/5–25): Topitop, Anko, Index, Shein, Genérico.
Tier 2 (S/20–60): Koaj, Basement, Ripley MDP, H&M/Zara básico.
Tier 3 (S/50–120): Zara, H&M, Mango, Adidas, Nike, Pull&Bear.
Tier 4 (S/100–220): Tommy Hilfiger, Lacoste, Guess, Levi's premium.
Tier 5 (S/180–400): Polo Ralph Lauren, Calvin Klein, Sybilla, Renzo Costa.
Tier 6 (S/350+): Lujo importado, marcas de diseñador (Butrich, etc).

REGLA DE MULTIPLICADOR POR ESTADO:
- "Nuevo con etiqueta" → 0.75
- "Muy buen estado" → 0.55
- "Buen estado" → 0.40
- "Con señales de uso" → 0.25

REGLAS CRÍTICAS:
1. El precio base (Retail) se estima por marca/modelo y NO varía con el estado.
2. Una prenda usada NUNCA puede ser más cara que su versión 'Nuevo con etiqueta'.
3. Para Tier 1, el precio sugerido difícilmente supera los S/25.

Devuelve EXCLUSIVAMENTE un JSON:
{
  "precio_sugerido": number,
  "precio_rango": { "min": number, "max": number },
  "razonamiento_precio": "Ej: Retail S/120 (Tier 3) x 0.40 (Buen estado)",
  "confianza_marca": number (0 a 1)
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
