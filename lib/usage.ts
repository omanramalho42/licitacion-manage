import { createClient } from "@/lib/supabase/server";

const MONTHLY_LIMIT = 5;

export type UsageCheckResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0 };

/**
 * Verifica o limite mensal e JÁ incrementa se houver saldo.
 * Use isso logo antes de gastar tokens/chamar a IA.
 */
export async function checkAndConsumeUsage(userId: string): Promise<UsageCheckResult> {
  const supabase = await createClient();
  if(!supabase) {
    return { allowed: false, remaining: 0 }
  }

  const { data, error }: any = await supabase
    .rpc("increment_prompt_usage", {
      p_user_id: userId,
      p_limit: MONTHLY_LIMIT,
    })
    .single();

  if (error) {
    console.error("[usage] Erro ao verificar limite:", error);
    // decide a política de fallback: aqui optei por bloquear em caso de erro
    return { allowed: false, remaining: 0 };
  }

  if (!data.allowed) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: data.remaining };
}

/**
 * Só consulta, sem gastar uma tentativa. Útil para mostrar "3/10" na UI.
 */
export async function getUsage(userId: string) {
  const supabase = await createClient();
  if(!supabase) {
    return { current_count: false, remaining: MONTHLY_LIMIT }
  }
  const { data, error } = await supabase
    .rpc("get_prompt_usage", {
      p_user_id: userId,
      p_limit: MONTHLY_LIMIT,
    })
    .single();

  if (error) {
    console.error("[usage] Erro ao consultar uso:", error);
    return { current_count: 0, remaining: MONTHLY_LIMIT };
  }

  return data;
}