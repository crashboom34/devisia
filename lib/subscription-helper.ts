import { supabase } from './supabase';

/**
 * Subscription Helper Functions
 * These functions abstract AI model details from the frontend
 */

export interface SubscriptionInfo {
  tier_name: string;
  tier_level: number;
  max_projects_per_month: number;
  max_estimates_per_project: number;
  priority_support: boolean;
  ai_capability_level: string;
}

export interface ProjectLimitInfo {
  limit: number;
  used: number;
  remaining: number;
  has_reached_limit: boolean;
  tier_name: string;
}

/**
 * Get user's current subscription information
 * Returns generic capability info WITHOUT exposing AI model details
 */
export async function getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_tiers:tier_id (
          name,
          display_name,
          tier_level,
          max_projects_per_month,
          max_estimates_per_project,
          priority_support
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      // Return free tier defaults
      return {
        tier_name: 'Free',
        tier_level: 0,
        max_projects_per_month: 5,
        max_estimates_per_project: 3,
        priority_support: false,
        ai_capability_level: 'Standard AI Intelligence',
      };
    }

    const tier = data.subscription_tiers as any;

    return {
      tier_name: tier.display_name,
      tier_level: tier.tier_level,
      max_projects_per_month: tier.max_projects_per_month,
      max_estimates_per_project: tier.max_estimates_per_project,
      priority_support: tier.priority_support,
      ai_capability_level: getAICapabilityLabel(tier.tier_level),
    };
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return null;
  }
}

/**
 * Check if user has reached their project limit
 * Uses database function for secure calculation
 */
export async function checkProjectLimit(userId: string): Promise<ProjectLimitInfo> {
  try {
    const { data, error } = await supabase.rpc('check_project_limit', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking project limit:', error);
      // Return safe defaults
      return {
        limit: 5,
        used: 0,
        remaining: 5,
        has_reached_limit: false,
        tier_name: 'Free',
      };
    }

    return data;
  } catch (error) {
    console.error('Error in checkProjectLimit:', error);
    return {
      limit: 5,
      used: 0,
      remaining: 5,
      has_reached_limit: false,
      tier_name: 'Free',
    };
  }
}

/**
 * Convert tier level to user-friendly AI capability label
 * This is what users see instead of specific model names
 */
export function getAICapabilityLabel(tierLevel: number): string {
  switch (tierLevel) {
    case 1:
      return 'Standard AI Intelligence';
    case 2:
      return 'Advanced AI Intelligence';
    case 3:
      return 'Premium AI Intelligence';
    case 4:
      return 'Enterprise-Grade AI Intelligence';
    default:
      return 'AI-Powered';
  }
}

/**
 * Get AI capability description for marketing
 */
export function getAICapabilityDescription(tierLevel: number): string {
  switch (tierLevel) {
    case 1:
      return 'Reliable estimates for straightforward projects with solid accuracy';
    case 2:
      return 'Enhanced understanding of complex requirements and nuanced details';
    case 3:
      return 'Superior accuracy for sophisticated projects with technical specifications';
    case 4:
      return 'Maximum intelligence with unparalleled accuracy and comprehensive analysis';
    default:
      return 'AI-powered construction estimates';
  }
}

/**
 * Check if user can create a new project
 * Returns both permission and helpful message
 */
export async function canCreateProject(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  upgrade_url?: string;
}> {
  const limitInfo = await checkProjectLimit(userId);

  if (limitInfo.has_reached_limit) {
    return {
      allowed: false,
      message: `You've reached your limit of ${limitInfo.limit} projects per month on the ${limitInfo.tier_name} plan.`,
      upgrade_url: '/pricing/new',
    };
  }

  return {
    allowed: true,
    message: `You have ${limitInfo.remaining} of ${limitInfo.limit} projects remaining this month.`,
  };
}

/**
 * Increment user's project usage counter
 * Called after successful project creation
 */
export async function incrementProjectUsage(userId: string): Promise<void> {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscription) {
      await supabase
        .from('user_subscriptions')
        .update({
          projects_used_this_period: (subscription.projects_used_this_period || 0) + 1,
        })
        .eq('id', subscription.id);
    }
  } catch (error) {
    console.error('Error incrementing project usage:', error);
  }
}

/**
 * Get upgrade suggestion message based on current tier
 */
export function getUpgradeSuggestion(tierLevel: number): string | null {
  switch (tierLevel) {
    case 0:
    case 1:
      return 'Upgrade to Professional for Advanced AI Intelligence and more projects';
    case 2:
      return 'Upgrade to Business for Premium AI Intelligence and priority support';
    case 3:
      return 'Upgrade to Enterprise for maximum AI capabilities and unlimited projects';
    default:
      return null;
  }
}
