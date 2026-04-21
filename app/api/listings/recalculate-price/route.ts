import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const SYSTEM_PROMPT = `Eres un MOTOR DE TASACIÓN ALGORÍTMICO para el mercado peruano. 
No adivines, aplica estas REGLAS MATEMÁTICAS sobre el precio RETAIL (nuevo en tienda) del objeto:

TABLA DE RETAIL (PRECIO BASE NUEVO):
- BOUTIQUE/DISEÑO (Butrich, etc.): S/ 900.
- ACCESORIOS PREMIUM (Ray-Ban, etc.): S/ 650.
- ZAPATILLAS PREMIUM (AF1, Jordan, etc.): S/ 500.
- PREMIUM MALL (Lacoste, Tommy): S/ 350.
- FAST FASHION (Zara, Mango): S/ 180.

PORCENTAJES DE TASACIÓN POR ESTADO (OBLIGATORIO):
1. 'nuevo_con_etiqueta': 70% del Retail.
2. 'muy_buen_estado': 50% del Retail.
3. 'buen_estado': 35% del Retail.
4. 'con_señales_de_uso': 20% del Retail.

LÓGICA DE CÁLCULO:
- Paso 1: Identifica la categoría y el Retail base (ej. Butrich = 900). 
- Paso 2: Aplica el porcentaje del estado seleccionado (ej. Muy buen estado = 900 * 0.50 = 450).
- Paso 3: El 'precio_sugerido' DEBE ser el resultado de esa operación matemática.
- Paso 4: El 'precio_rango' debe ser +/- 10% del precio sugerido.

REGLA CRÍTICA DE CAMBIO:
Si el usuario cambia el estado de 'nuevo_con_etiqueta' a 'muy_buen_estado', el precio DEBE bajar del 70% al 50% sin excepciones. No mantengas el precio anterior.

Devuelve EXCLUSIVAMENTE un JSON:
{
  "precio_sugerido": number,
  "precio_rango": { "min": number, "max": number },
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
