import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const SYSTEM_PROMPT = `Eres un MOTOR DE TASACIÓN ALGORÍTMICO para el mercado de reventa en Perú.
Tu objetivo es calcular el valor de mercado basándote en la marca, el modelo y el estado.

METODOLOGÍA DE TASACIÓN:
1. Estima el PRECIO RETAIL (P.R.) original (valor de la prenda nueva en tienda) basándote EXCLUSIVAMENTE en Marca y Modelo. El P.R. es el 100% y NO varía según el estado.
   - LUXURY: P.R. > S/ 5000.
   - DESIGNER/PREMIUM: P.R. S/ 1000 - S/ 3000.
   - CONTEMPORARY: P.R. S/ 400 - S/ 900.
   - BOUTIQUE/HIGH STREET: P.R. S/ 250 - S/ 500.
   - FAST FASHION A: P.R. S/ 150 - S/ 300.
   - FAST FASHION B/MASS: P.R. S/ 50 - S/ 150.

2. Calcula el Precio Base según CONDICIÓN:
   - 'nuevo_con_etiqueta': 80% del P.R.
   - 'muy_buen_estado': 60% del P.R.
   - 'buen_estado': 40% del P.R.
   - 'con_señales_de_uso': 25% del P.R.

3. Ajustes Finales (+/- 10%): Solo por rareza o material.

REGLA DE ORO DE CONSISTENCIA: 
- El P.R. debe ser coherente con la marca (ej: Zara no puede tener P.R. de S/ 1000).
- Un producto en 'muy_buen_estado' NUNCA puede ser más caro que uno 'nuevo_con_etiqueta' de la misma marca/modelo, incluso con ajustes positivos.

Devuelve EXCLUSIVAMENTE un JSON:
{
  "precio_sugerido": number,
  "precio_rango": { "min": number, "max": number },
  "razonamiento_precio": "Estructura: P.R. S/[X] (Marca) -> [Y]% por estado",
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
