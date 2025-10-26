import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  projectId?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();
    const { projectId, prompt, temperature = 0.7, maxTokens = 2000 } = body;

    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    const startTime = Date.now();

    const { data: userPreference } = await supabase
      .from('user_preferences')
      .select('preferred_model_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let modelId = userPreference?.preferred_model_id;

    if (!modelId) {
      const { data: defaultModel } = await supabase
        .from('ai_models')
        .select('id')
        .eq('is_active', true)
        .eq('cost_per_1k_tokens_input', 0)
        .eq('cost_per_1k_tokens_output', 0)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultModel) {
        modelId = defaultModel.id;
      } else {
        const { data: anyModel } = await supabase
          .from('ai_models')
          .select('id')
          .eq('is_active', true)
          .order('cost_per_1k_tokens_input', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!anyModel) {
          throw new Error('No active AI models configured');
        }
        modelId = anyModel.id;
      }
    }

    const { data: modelConfig, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .eq('is_active', true)
      .maybeSingle();

    if (modelError || !modelConfig) {
      throw new Error('Selected model not found or not active');
    }

    const { data: apiKeyConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', `${modelConfig.provider}_api_key`)
      .eq('category', 'api_keys')
      .maybeSingle();

    if (!apiKeyConfig?.value) {
      throw new Error(`No API key configured for provider: ${modelConfig.provider}`);
    }

    const apiKey = apiKeyConfig.value;
    let apiResponse;
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    let content = '';

    if (modelConfig.provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': supabaseUrl,
        },
        body: JSON.stringify({
          model: modelConfig.model_id,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
      }

      apiResponse = await response.json();
      content = apiResponse.choices[0]?.message?.content || '';
      usage = apiResponse.usage || usage;
    } else if (modelConfig.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelConfig.model_id,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      apiResponse = await response.json();
      content = apiResponse.content[0]?.text || '';
      usage = {
        prompt_tokens: apiResponse.usage?.input_tokens || 0,
        completion_tokens: apiResponse.usage?.output_tokens || 0,
        total_tokens: (apiResponse.usage?.input_tokens || 0) + (apiResponse.usage?.output_tokens || 0),
      };
    } else if (modelConfig.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelConfig.model_id,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      apiResponse = await response.json();
      content = apiResponse.choices[0]?.message?.content || '';
      usage = apiResponse.usage || usage;
    } else {
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    const durationMs = Date.now() - startTime;

    const cost = (
      (usage.prompt_tokens / 1000) * modelConfig.cost_per_1k_tokens_input +
      (usage.completion_tokens / 1000) * modelConfig.cost_per_1k_tokens_output
    );

    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      project_id: projectId || null,
      model_id: modelConfig.id,
      provider: modelConfig.provider,
      endpoint: 'llm-proxy',
      tokens_input: usage.prompt_tokens,
      tokens_output: usage.completion_tokens,
      cost,
      duration_ms: durationMs,
      status: 'success',
      request_metadata: {
        model_name: modelConfig.display_name,
        temperature,
        max_tokens: maxTokens,
      },
    });

    return new Response(
      JSON.stringify({
        content,
        usage,
        model: modelConfig.display_name,
        provider: modelConfig.provider,
        cost,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in llm-proxy:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          await supabase.from('api_usage_logs').insert({
            user_id: user.id,
            provider: 'unknown',
            endpoint: 'llm-proxy',
            status: 'error',
            error_message: errorMessage,
            request_metadata: { error: errorMessage },
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
