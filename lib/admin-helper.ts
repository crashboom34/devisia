import { supabase } from './supabase';

export interface AdminStatus {
  isAdmin: boolean;
  canBypassLimits: boolean;
  simulatedPlan?: string | null;
}

export async function checkAdminStatus(userId: string): Promise<AdminStatus> {
  try {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const isAdmin = !!adminData;

    const simulatedPlan = isAdmin
      ? localStorage.getItem(`admin_simulated_plan_${userId}`)
      : null;

    return {
      isAdmin,
      canBypassLimits: isAdmin && !simulatedPlan,
      simulatedPlan,
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return {
      isAdmin: false,
      canBypassLimits: false,
      simulatedPlan: null,
    };
  }
}

export function setSimulatedPlan(userId: string, planId: string | null) {
  if (planId) {
    localStorage.setItem(`admin_simulated_plan_${userId}`, planId);
  } else {
    localStorage.removeItem(`admin_simulated_plan_${userId}`);
  }
}

export function getSimulatedPlan(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`admin_simulated_plan_${userId}`);
}
