import { createClient } from '@supabase/supabase-js';

// Usamos el cliente admin (service_role) para bypasar RLS en operaciones de servidor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const PLAN_CREDITS: Record<string, number> = {
  free:      2,
  starter:   75,
  pro:       250,
  unlimited: Infinity,
};

export interface CreditInfo {
  plan:              string;
  credits_total:     number;
  credits_used:      number;
  credits_remaining: number;
  reset_date:        string;
}

/**
 * Obtiene o crea el registro de créditos para un usuario.
 * Implementa reset lazy: si reset_date pasó, reinicia los créditos.
 */
export async function getOrCreateCredits(userId: string): Promise<CreditInfo> {
  const { data, error } = await supabaseAdmin
    .from('listing_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Si no existe, crear con plan free
  if (error || !data) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);

    const { data: newRecord, error: createError } = await supabaseAdmin
      .from('listing_credits')
      .insert({
        user_id:       userId,
        plan:          'free',
        credits_total: PLAN_CREDITS.free,
        credits_used:  0,
        reset_date:    resetDate.toISOString(),
      })
      .select()
      .single();

    if (createError || !newRecord) {
      throw new Error(`Error creando registro de créditos: ${createError?.message}`);
    }

    return buildCreditInfo(newRecord);
  }

  // Reset lazy: si la fecha de reset pasó, reiniciar créditos
  const now = new Date();
  const resetDate = new Date(data.reset_date);

  if (now > resetDate) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);

    const { data: resetData } = await supabaseAdmin
      .from('listing_credits')
      .update({ credits_used: 0, reset_date: nextReset.toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (resetData) return buildCreditInfo(resetData);
  }

  return buildCreditInfo(data);
}

/**
 * Verifica si un usuario tiene créditos disponibles.
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const info = await getOrCreateCredits(userId);
  if (info.plan === 'unlimited') return true;
  return info.credits_remaining > 0;
}

/**
 * Descuenta 1 crédito al usuario y determina el tipo de uso.
 */
export async function deductCredit(userId: string): Promise<'free' | 'prepaid' | 'on_demand'> {
  // Leer el valor actual primero
  const { data: current } = await supabaseAdmin
    .from('listing_credits')
    .select('credits_used, credits_total, plan')
    .eq('user_id', userId)
    .single();

  if (!current) throw new Error("No credit info found");

  const FREE_GIFT_LIMIT = 2;
  let usageType: 'free' | 'prepaid' | 'on_demand' = 'on_demand';

  if (current.credits_used < FREE_GIFT_LIMIT) {
    usageType = 'free';
  } else if (current.credits_used < current.credits_total) {
    usageType = 'prepaid';
  } else {
    // Si llegamos aquí es porque permitimos el uso on_demand (validado antes en el API)
    usageType = 'on_demand';
  }

  if (current.plan !== 'unlimited') {
    await supabaseAdmin
      .from('listing_credits')
      .update({ credits_used: current.credits_used + 1 })
      .eq('user_id', userId);
  }

  return usageType;
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  const current = await getOrCreateCredits(userId);
  if (current.plan === 'unlimited') return;

  await supabaseAdmin
    .from('listing_credits')
    .update({ credits_total: current.credits_total + amount })
    .eq('user_id', userId);
}

/**
 * Migra al usuario a un nuevo plan, sumando créditos remanentes.
 */
export async function migratePlan(userId: string, targetPlanId: string): Promise<void> {
  const current = await getOrCreateCredits(userId);
  
  const planDefinitions: Record<string, { limit: number, ai: number, dbValue: string }> = {
    impulso: { limit: 10, ai: 6, dbValue: 'starter' },
    crecimiento: { limit: 30, ai: 15, dbValue: 'pro' },
    escala: { limit: 60, ai: 35, dbValue: 'unlimited' }
  };
  
  const target = planDefinitions[targetPlanId.replace('plan_', '')];
  if (!target) return;

  // Lógica: Sumar créditos IA remanentes al nuevo paquete
  const remainingAiCredits = Math.max(0, current.credits_total - current.credits_used);
  const newTotalAi = target.ai + remainingAiCredits;
  
  await supabaseAdmin
    .from('listing_credits')
    .update({ 
      plan: target.dbValue,
      credits_total: newTotalAi,
      credits_used: 0 // Reiniciamos el contador porque el remanente ya está en el nuevo total
    })
    .eq('user_id', userId);
}

function buildCreditInfo(row: {
  plan: string;
  credits_total: number;
  credits_used: number;
  reset_date: string;
}): CreditInfo {
  const isUnlimited = row.plan === 'unlimited';
  return {
    plan:              row.plan,
    credits_total:     row.credits_total,
    credits_used:      row.credits_used,
    credits_remaining: isUnlimited
      ? Infinity
      : Math.max(0, row.credits_total - row.credits_used),
    reset_date:        row.reset_date,
  };
}
