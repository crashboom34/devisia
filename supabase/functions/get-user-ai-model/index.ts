import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * Securely retrieves the AI model assigned to user's subscription tier
 * This function NEVER exposes model details to the frontend
 * Frontend receives only a generic identifier
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Use the database function to get user's AI model
    const { data: modelData, error: modelError } = await supabase.rpc(
      'get_user_ai_model',
      { p_user_id: user.id }
    );

    if (modelError) {
      console.error("Error fetching user AI model:", modelError);

      // Fallback: Get the lowest tier / free model
      const { data: fallbackModel } = await supabase
        .from('ai_models')
        .select('id, model_id, provider, max_tokens')
        .eq('is_active', true)
        .order('cost_per_1k_tokens_input', { ascending: true })
        .limit(1)
        .single();

      if (fallbackModel) {
        return new Response(
          JSON.stringify({
            model_id: fallbackModel.id,
            model_identifier: fallbackModel.model_id,
            provider: fallbackModel.provider,
            max_tokens: fallbackModel.max_tokens,
            tier_info: "Free Tier - Standard AI Intelligence",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      throw new Error("No available AI model found");
    }

    // Get subscription tier info (generic capability level only)
    const { data: subscriptionData } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_tiers:tier_id (
          display_name,
          tier_level
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    let tierInfo = "Standard AI Intelligence";
    if (subscriptionData && subscriptionData.subscription_tiers) {
      const tier = subscriptionData.subscription_tiers as any;
      tierInfo = getAICapabilityLabel(tier.tier_level);
    }

    // Return model info (for backend use) + generic tier info (safe for frontend)
    return new Response(
      JSON.stringify({
        model_id: modelData[0]?.model_id,
        model_identifier: modelData[0]?.model_identifier,
        provider: modelData[0]?.provider,
        max_tokens: modelData[0]?.max_tokens,
        tier_info: tierInfo, // This is the ONLY thing frontend should see
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error in get-user-ai-model:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

/**
 * Convert tier level to user-friendly AI capability label
 */
function getAICapabilityLabel(tierLevel: number): string {
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
