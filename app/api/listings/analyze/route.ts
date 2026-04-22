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
- Los compradores son peruanos, principalmente de Lima y ciudades principales.
- El mercado local mezcla marcas internacionales con marcas locales peruanas y latinoamericanas.
- Los precios deben ser competitivos dentro del mercado peruano de segunda mano.

CONOCIMIENTO DE MARCAS QUE DEBES TENER:

MARCAS PERUANAS (origen: Perú):
- Topitop, Topi10 — ropa masiva, precio bajo en segunda mano
- Sybilla — marca premium peruana de mujer, buena reputación
- Renzo Costa — cuero, accesorios, casacas, alta calidad
- Capittana — ropa de playa, bikinis, precio medio-alto
- Camote Soup — ropa juvenil colorida, tallas únicas
- Peruvian Flake — ropa activa y urbana juvenil
- Butrich — calzado y accesorios femeninos
- LaLaLove — calzado femenino de diseñador
- Basement (línea de Saga Falabella) — moda juvenil local
- Marquis (línea de Ripley) — moda femenina local
- Index (línea de Ripley) — moda casual
- Anko (línea de Falabella) — básicos, precio bajo
- Libero — ropa interior masculina peruana
- Azúcar — moda femenina popular
- Michelle Belau — diseñadora peruana premium
- Trendify — marca de segunda mano curada peruana

MARCAS LATINOAMERICANAS PRESENTES EN PERÚ:
- Koaj (Colombia) — moda urbana accesible
- Arturo Calle (Colombia) — moda masculina formal
- Forever 21 (operó en Perú) — moda fast fashion
- Saga Falabella, Ripley, Paris — tiendas departamentales con marcas propias

MARCAS INTERNACIONALES POPULARES EN PERÚ:
- Zara, H&M, Mango, Pull&Bear, Bershka (Inditex) — fast fashion europea
- Adidas, Nike, Puma, Reebok, Under Armour — deportiva
- Levi's, Wrangler, Lee — denim
- Tommy Hilfiger, Polo Ralph Lauren, Lacoste — premium casual
- Guess, Calvin Klein, DKNY — premium
- Forever 21, Shein (ropa sin valor de reventa)

ESCALA DE VALOR DE MARCAS EN SEGUNDA MANO (de menor a mayor precio de reventa):
Tier 1 (precio muy bajo S/5–25): Topitop, Anko, Index, ropa sin marca, Shein
Tier 2 (precio bajo S/20–60): Koaj, Basement, Ripley MDP, ropa básica H&M/Zara
Tier 3 (precio medio S/50–120): Zara, H&M, Mango, Adidas, Nike, Pull&Bear
Tier 4 (precio medio-alto S/100–220): Tommy Hilfiger, Lacoste, Guess, Levi's premium
Tier 5 (precio alto S/180–400): Polo Ralph Lauren, Calvin Klein, Sybilla, Renzo Costa
Tier 6 (precio muy alto S/350+): Lujo importado, piezas de colección, marcas de diseñador

REGLA CRÍTICA DE PRECIOS SEGÚN ESTADO:
El precio base se calcula según la marca (tier) y tipo de prenda.
Luego se aplica el MULTIPLICADOR DE ESTADO:
- "Nuevo con etiqueta" → precio base × 0.75 (ej: prenda nueva de S/100 → S/75)
- "Muy buen estado" → precio base × 0.55
- "Buen estado" → precio base × 0.40
- "Con señales de uso" → precio base × 0.25

REGLAS IMPORTANTES PARA EL ANÁLISIS:
1. Si la marca no es claramente visible en la imagen o no fue indicada, poner "Sin marca / sin etiqueta visible" — NUNCA inventar marcas.
2. Diferenciar siempre entre marca peruana, latinoamericana o internacional.
3. Para prendas sin marca o de marcas muy básicas (Tier 1), el precio máximo rara vez supera S/25 en cualquier estado.
4. La condición declarada por el vendedor tiene prioridad sobre lo que se ve en la imagen para el precio.
5. Si la imagen muestra daños (manchas, roturas) no declarados, incluirlos en las advertencias.
6. Las medidas exactas (largo, busto, cintura) son más útiles que la talla de etiqueta.
7. CONSISTENCIA: Una prenda usada NUNCA puede ser más cara que su versión 'nuevo_con_etiqueta'.

FORMATO DE RESPUESTA JSON REQUERIDO:
{
  "marca": { "nombre": "string", "origen": "string", "tier_valor": number, "confianza": number },
  "clasificacion": { "genero": "Mujer | Hombre | Niños | Unisex", "categoria_principal": "string", "tipo_prenda": "string", "estilo": ["string"] },
  "caracteristicas": { "color_principal": "string", "material_estimado": "string", "talla_etiqueta": "string", "condicion": "nuevo_con_etiqueta | muy_buen_estado | buen_estado | con_señales_de_uso" },
  "precio": { "precio_sugerido_soles": number, "rango_minimo": number, "rango_maximo": number, "precio_original_estimado": number, "multiplicador_estado": number, "logica": "Explicación breve del cálculo" },
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
      razonamiento_precio: raw.precio?.logica || "",
      hashtags_instagram: raw.listado?.hashtags || [],
      keywords_busqueda: raw.listado?.keywords_busqueda || [],
      advertencias: raw.estado_analisis?.advertencias || [],
      // Otros campos de interés
      modelo: raw.clasificacion?.subcategoria || "",
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
