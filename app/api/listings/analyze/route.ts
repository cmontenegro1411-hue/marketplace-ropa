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

const SYSTEM_PROMPT = `Eres una consultora de moda de lujo y experta en tasación para el mercado de reventa en Perú. Tu objetivo es asignar un precio justo que garantice una rotación rápida (venta en menos de 15 días).

Analizá la imagen y devolvé ÚNICAMENTE un JSON con esta estructura exacta:
{
  "titulo": "Título SEO: Marca + Prenda + Color + Detalle (máx 70 caracteres)",
  "descripcion": "Storytelling persuasivo: Comienza con un gancho sobre la calidad/diseño. Describe el material y por qué es esencial.",
  "marca": "marca detectada o null",
  "confianza_marca": 0.0,
  "categoria": "Mujer | Hombre | Niños | Unisex",
  "tipo_producto": "Ropa | Calzado | Accesorios",
  "tipo_prenda": "Nombre común",
  "color": "Color descriptivo",
  "material": "Material estimado (ej: Algodón pima, Cuero real)",
  "vendedor_recomendacion": "string (consejo de venta)",
  "modelo": "string o null",
  "estilo": ["mínimo 3 etiquetas"],
  "condicion": "nuevo_con_etiqueta | muy_buen_estado | buen_estado | con_señales_de_uso",
  "precio_sugerido": 0,
  "precio_rango": { "min": 0, "max": 0 },
  "razonamiento_precio": "Explicación breve de la tasación (max 120 caracteres)",
  "hashtags_instagram": ["5 relevantes"],
  "keywords_busqueda": ["7 términos"],
  "plataforma_ideal": "vinted | depop | poshmark",
  "advertencias": []
}

METODOLOGÍA DE TASACIÓN (MERCADO PERÚ):
1. Identifica la Marca y el Tipo de Prenda.
2. Estima el PRECIO RETAIL ACTUAL (nuevo en tienda) basándote en estos TIERS DE REFERENCIA:
   - LUXURY (Hermès, LV, Chanel): Retail > S/ 5000.
   - DESIGNER/PREMIUM (Gucci, Butrich, Zimmermann, Coach): Retail S/ 1000 - S/ 3000.
   - CONTEMPORARY (Tommy, Lacoste, Calvin Klein, Michael Kors): Retail S/ 400 - S/ 900.
   - BOUTIQUE/HIGH STREET (Massimo Dutti, Banana Republic, Zara Premium): Retail S/ 250 - S/ 500.
   - FAST FASHION A (Zara, Mango, H&M Premium): Retail S/ 150 - S/ 300.
   - FAST FASHION B/MASS (H&M, Forever 21, Topitop): Retail S/ 50 - S/ 150.

3. Aplica el multiplicador por CONDICIÓN:
   - 'nuevo_con_etiqueta': 60% a 75% del Retail.
   - 'muy_buen_estado': 45% a 55% del Retail.
   - 'buen_estado': 30% a 40% del Retail.
   - 'con_señales_de_uso': 15% a 25% del Retail.

4. AJUSTES FINALES (+/- 15%):
   - +15% si es material noble (Cuero, Seda, Cashmere, Algodón Pima).
   - +20% si es una pieza icónica o muy buscada (Hype).
   - -10% si el color es muy difícil o está fuera de temporada.

REGLAS CRÍTICAS:
- 'razonamiento_precio' debe ser transparente. Ejemplo: "Retail estimado S/ 350 (Tommy), -50% por estado, +10% por material."
- No inventar marcas. Si es genérico, usa Tier FAST FASHION B.
- 'categoria' DEBE ser uno de: "Mujer", "Hombre", "Niños", "Unisex".
- 'tipo_producto' DEBE ser uno de: "Ropa", "Calzado", "Accesorios".`;

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

    // 3. Verificar créditos y conexión Mercado Pago
    const creditInfo = await getOrCreateCredits(userId);
    
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('mp_access_token')
      .eq('id', userId)
      .single();

    const isAdmin = (session.user as any)?.role === 'admin';
    const isMPConnected = !!userData?.mp_access_token;
    const isBypassEnabled = process.env.ALLOW_DEBUG_BYPASS === 'true' || process.env.NEXT_PUBLIC_ALLOW_DEBUG_BYPASS === 'true';

    // 🔴 BLOQUEO OBLIGATORIO: Si no es admin y no tiene MP, bloqueamos siempre (a menos que bypass esté activo).
    if (!isAdmin && !isMPConnected && !isBypassEnabled) {
      return NextResponse.json(
        {
          error: 'Atención: Para usar la IA y publicar prendas es OBLIGATORIO vincular tu cuenta de Mercado Pago en tu perfil. Esto garantiza que puedas recibir tus pagos de forma automática.',
          credits: creditInfo,
          needsMP: true
        },
        { status: 402 }
      );
    }

    // 4. Validar saldo estricto
    const hasCredits = isAdmin || creditInfo.plan === 'unlimited' || creditInfo.credits_remaining > 0;

    // Ya NO permitimos paso por 'canUseOnDemand' si no hay saldo. 
    // El sistema debe forzar al usuario a comprar un pack de créditos.
    if (!hasCredits) {
      return NextResponse.json(
        { 
          error: 'Atención: Has agotado tus créditos gratuitos. Para seguir analizando prendas debes comprar un pack de créditos.',
          errorCode: 'CREDITS_EXHAUSTED',
          credits: creditInfo 
        },
        { status: 403 }
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

    // 8. Descontar crédito SOLO en éxito y obtener tipo de uso (Bypass admin)
    const aiUsageType = isAdmin ? 'free' : await deductCredit(userId);

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

    return NextResponse.json({ 
      success: true, 
      data: result, 
      credits: updatedCredits,
      ai_usage_type: aiUsageType 
    });
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
