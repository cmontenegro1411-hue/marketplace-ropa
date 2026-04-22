import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const SYSTEM_PROMPT = `Eres un MOTOR DE TASACIÓN ALGORÍTMICO para el mercado de reventa en Perú.
Tu objetivo es calcular el valor de mercado basándote en la marca, el modelo y el estado.

METODOLOGÍA DE TASACIÓN:
1. Estima el PRECIO RETAIL ACTUAL (nuevo en tienda) basándote en estos TIERS:
   - LUXURY (Hermès, LV, Chanel): Retail > S/ 5000.
   - DESIGNER/PREMIUM (Gucci, Butrich, Zimmermann): Retail S/ 1000 - S/ 3000.
   - CONTEMPORARY (Tommy, Lacoste, Michael Kors): Retail S/ 400 - S/ 900.
   - BOUTIQUE/HIGH STREET (Massimo Dutti, Zara Premium): Retail S/ 250 - S/ 500.
   - FAST FASHION A (Zara, Mango): Retail S/ 150 - S/ 300.
   - FAST FASHION B/MASS (H&M, Topitop): Retail S/ 50 - S/ 150.

2. Aplica el % por CONDICIÓN (Jerarquía Estricta):
   - 'nuevo_con_etiqueta': 80% del Retail.
   - 'muy_buen_estado': 60% del Retail.
   - 'buen_estado': 40% del Retail.
   - 'con_señales_de_uso': 25% del Retail.

3. Ajusta +/- 10% según la relevancia de la marca o modelo específico.

REGLA DE ORO: Si para una misma marca/modelo la condición es mejor, el precio DEBE ser mayor.

Devuelve EXCLUSIVAMENTE un JSON:
{
  "precio_sugerido": number,
  "precio_rango": { "min": number, "max": number },
  "razonamiento_precio": "Explicación breve (ej: Retail S/ 350, 80% por ser Nuevo)",
  "confianza_marca": number (0.0 a 1.0)
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
