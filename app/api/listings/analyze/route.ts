import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';
import { getOrCreateCredits, deductCredit } from '@/lib/credits';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limit: 5 req/min por usuario (in-memory, válido para instancia única)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 5;

  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `Eres un experto en moda vintage y segunda mano especializado en el mercado peruano. Analizá la imagen de la prenda y devolvé ÚNICAMENTE un JSON válido con esta estructura exacta, sin markdown, sin explicaciones, solo el JSON:
{
  "titulo": "título SEO optimizado máximo 80 caracteres, incluir marca si visible",
  "descripcion": "descripción de 150 a 300 palabras, mencionar material, estilo, época, cómo combinarlo",
  "marca": "nombre de marca detectada o null si no se ve claramente",
  "confianza_marca": 0.0,
  "categoria": "Mujer | Hombre | Accesorios | Calzado",
  "subcategoria": "subcategoría específica: Vestido, Pantalón, Blusa, Camisa, etc.",
  "color": "color principal descriptivo",
  "material": "material estimado",
  "estilo": ["array de hasta 4 estilos"],
  "condicion": "nuevo_con_etiqueta | muy_buen_estado | buen_estado | con_señales_de_uso",
  "precio_sugerido": 0,
  "precio_rango": { "min": 0, "max": 0 },
  "hashtags_instagram": ["hasta 12 hashtags sin el # en español e inglés"],
  "keywords_busqueda": ["hasta 7 palabras clave para búsqueda"],
  "plataforma_ideal": "depop | poshmark | vinted | mercari",
  "advertencias": []
}
REGLAS:
- precio_sugerido y precio_rango en SOLES PERUANOS (S/) acordes al mercado de segunda mano peruano.
- Si confianza_marca < 0.7: poner null en "marca" y agregar "Verificá la etiqueta de marca" en advertencias.
- NUNCA inventar marcas ni datos no visibles en la imagen.`;

interface GPTResult {
  parsed: Record<string, unknown>;
  usage: { prompt_tokens: number; completion_tokens: number } | undefined;
}

async function callGPT4o(imageBase64: string, mediaType: string): Promise<GPTResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1500,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
          { type: 'text', text: 'Analizá esta prenda y devolvé el JSON.' },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Respuesta vacía de GPT-4o');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se encontró JSON válido en la respuesta');

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  return {
    parsed,
    usage: response.usage
      ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
        }
      : undefined,
  };
}

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  let tokensInput = 0;
  let tokensOutput = 0;
  let costUsd = 0;

  try {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    userId = session.user.id;

    // 2. Rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Límite de solicitudes excedido (5 por minuto). Esperá un momento.' },
        { status: 429 }
      );
    }

    // 3. Verificar créditos (sin descontarlos todavía)
    const creditInfo = await getOrCreateCredits(userId);
    if (creditInfo.plan !== 'unlimited' && creditInfo.credits_remaining <= 0) {
      return NextResponse.json(
        {
          error: 'No tenés créditos disponibles este mes. Actualizá tu plan para continuar.',
          credits: creditInfo,
        },
        { status: 402 }
      );
    }

    // 4. Parsear body
    const body = (await req.json()) as { image?: string; mediaType?: string };
    const { image, mediaType } = body;

    if (!image || !mediaType) {
      return NextResponse.json({ error: 'Se requiere imagen y tipo de medio.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Usá JPG, PNG o WEBP.' },
        { status: 400 }
      );
    }

    // 5. Llamar GPT-4o con timeout de 30s y 1 reintento
    let result: Record<string, unknown>;
    let usage: { prompt_tokens: number; completion_tokens: number } | undefined;

    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: el análisis demoró más de 30 segundos')), ms)
        ),
      ]);

    try {
      const res = await withTimeout(callGPT4o(image, mediaType), 30_000);
      result = res.parsed;
      usage = res.usage;
    } catch {
      console.warn('[analyze] Primer intento fallido, reintentando...');
      const retry = await withTimeout(callGPT4o(image, mediaType), 30_000);
      result = retry.parsed;
      usage = retry.usage;
    }

    // 6. Calcular costo
    tokensInput = usage?.prompt_tokens ?? 0;
    tokensOutput = usage?.completion_tokens ?? 0;
    // Precios GPT-4o: $2.50/1M tokens input, $10/1M tokens output
    costUsd = tokensInput * 0.0000025 + tokensOutput * 0.00001;

    // 7. Validar confianza de marca
    if (
      result.marca &&
      typeof result.confianza_marca === 'number' &&
      result.confianza_marca < 0.7
    ) {
      result.marca = null;
      const advertencias = Array.isArray(result.advertencias) ? result.advertencias : [];
      if (!advertencias.includes('Verificá la etiqueta de marca')) {
        advertencias.push('Verificá la etiqueta de marca');
      }
      result.advertencias = advertencias;
    }

    // 8. Descontar crédito SOLO en éxito
    await deductCredit(userId);

    // 9. Loguear generación
    await supabaseAdmin
      .from('ai_generations_log')
      .insert({
        user_id:      userId,
        model_used:   'gpt-4o',
        tokens_input:  tokensInput,
        tokens_output: tokensOutput,
        cost_usd:      costUsd,
        success:       true,
      })
      .then(({ error }) => {
        if (error) console.error('[analyze] Error logging generation:', error);
      });

    // 10. Obtener créditos actualizados
    const updatedCredits = await getOrCreateCredits(userId);

    return NextResponse.json({ success: true, data: result, credits: updatedCredits });
  } catch (error: unknown) {
    // Log del intento fallido (ignorar errores de logging)
    if (userId) {
      await supabaseAdmin
        .from('ai_generations_log')
        .insert({
          user_id:      userId,
          model_used:   'gpt-4o',
          tokens_input:  tokensInput,
          tokens_output: tokensOutput,
          cost_usd:      costUsd,
          success:       false,
        })
        .then(({ error }) => {
          if (error) console.error('[analyze] Error logging failure:', error);
        });
    }

    const message =
      error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[analyze] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
