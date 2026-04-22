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

const SYSTEM_PROMPT = `Eres el motor de inteligencia artificial de una plataforma peruana de compraventa de ropa y accesorios de segunda mano. Tu función es analizar prendas a partir de imágenes y/o datos ingresados por el vendedor, y generar un listado completo, preciso y optimizado para búsqueda.

CONTEXTO DE MERCADO EN EL QUE OPERAS:
- Plataforma localizada en Perú, con precios en soles peruanos (S/).
- El mercado local mezcla marcas internacionales con marcas locales peruanas y latinoamericanas.

CONOCIMIENTO DE MARCAS Y TIERS DE VALOR RETAIL (P.R. - Precio Nuevo en Tienda):
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
1. Una prenda usada NUNCA puede ser más cara que su versión 'nuevo_con_etiqueta'.
2. NUNCA devuelvas un precio sugerido de 0. El mínimo es S/5.
3. Si la marca no es visible, clasifícala como "Genérico" (Tier 1).

FORMATO DE RESPUESTA JSON REQUERIDO:
{
  "marca": { "nombre": "string", "origen": "Perú | Internacional | Latinoamérica", "tier_valor": number, "confianza": number },
  "clasificacion": { "genero": "Mujer | Hombre | Niños | Unisex", "categoria_principal": "string", "tipo_prenda": "string", "estilo": ["string"] },
  "caracteristicas": { "color_principal": "string", "material_estimado": "string", "talla_etiqueta": "string", "condicion": "nuevo_con_etiqueta | muy_buen_estado | buen_estado | con_señales_de_uso" },
  "precio": { "precio_sugerido_soles": number, "rango_minimo": number, "rango_maximo": number, "precio_original_estimado": number, "multiplicador_estado": number, "logica": "Ej: P.R. S/200 (Tier 3) x 0.75 (Nuevo)" },
  "listado": { "titulo": "string", "descripcion": "string", "keywords_busqueda": ["string"], "hashtags": ["string"] },
  "estado_analisis": { "advertencias": ["string"] }
}`;

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

    // 7. Transformar resultado anidado a estructura plana para el frontend
    const raw: any = result;
    const mappedResult = {
      titulo: raw.listado?.titulo || "Prenda sin título",
      descripcion: raw.listado?.descripcion || "",
      marca: raw.marca?.nombre || null,
      confianza_marca: raw.marca?.confianza || 0,
      categoria: raw.clasificacion?.genero || "Unisex",
      tipo_prenda: raw.clasificacion?.tipo_prenda || raw.clasificacion?.categoria_principal || "Ropa",
      color: raw.caracteristicas?.color_principal || "Multicolor",
      material: raw.caracteristicas?.material_estimado || "Mezcla",
      estilo: raw.clasificacion?.estilo || [],
      condicion: raw.caracteristicas?.condicion || "buen_estado",
      precio_sugerido: raw.precio?.precio_sugerido_soles || 0,
      precio_rango: { 
        min: raw.precio?.rango_minimo || 0, 
        max: raw.precio?.rango_maximo || 0 
      },
      precio_original_estimado: raw.precio?.precio_original_estimado || 0,
      razonamiento_precio: raw.precio?.logica || "",
      hashtags_instagram: raw.listado?.hashtags || [],
      keywords_busqueda: raw.listado?.keywords_busqueda || [],
      advertencias: raw.estado_analisis?.advertencias || [],
      // Otros campos de interés
      modelo: raw.clasificacion?.subcategoria || raw.clasificacion?.tipo_prenda || "",
      plataforma_ideal: "vinted",
      vendedor_recomendacion: raw.metadatos?.sugerencias_para_mejorar_venta?.[0] || ""
    };

    // 8. Validar confianza de marca
    if (
      mappedResult.marca &&
      mappedResult.confianza_marca < 0.7
    ) {
      mappedResult.marca = null;
      if (!mappedResult.advertencias.includes('Verificá la etiqueta de marca')) {
        mappedResult.advertencias.push('Verificá la etiqueta de marca');
      }
    }

    // 9. Descontar crédito SOLO en éxito y obtener tipo de uso (Bypass admin)
    const aiUsageType = isAdmin ? 'free' : await deductCredit(userId);

    // 10. Loguear generación
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

    // 11. Obtener créditos actualizados
    const updatedCredits = await getOrCreateCredits(userId);

    return NextResponse.json({ 
      success: true, 
      data: mappedResult, 
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
