# Backend API Integration System - Technical Documentation

## Architecture Overview

This system implements a secure, scalable backend proxy for LLM API integrations with built-in usage tracking, rate limiting, and monetization capabilities.

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       │ HTTPS + JWT Auth
       ▼
┌─────────────────────────────────────┐
│   Supabase Edge Functions           │
│   ┌──────────────┐  ┌─────────────┐ │
│   │  llm-proxy   │  │  generate-  │ │
│   │              │  │  estimate   │ │
│   └──────┬───────┘  └──────┬──────┘ │
│          │                 │        │
│          └────────┬────────┘        │
│                   │                 │
│            ┌──────▼──────┐          │
│            │ Rate Limit  │          │
│            │  Checker    │          │
│            └──────┬──────┘          │
│                   │                 │
│            ┌──────▼──────┐          │
│            │   Usage     │          │
│            │   Logger    │          │
│            └──────┬──────┘          │
└────────────────────│─────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ External LLM APIs      │
        │ - OpenRouter           │
        │ - OpenAI (direct)      │
        │ - Anthropic (direct)   │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Supabase Database     │
        │  - api_usage_logs      │
        │  - system_config       │
        │  - ai_models           │
        │  - rate_limits         │
        └────────────────────────┘
```

## Security Architecture

### 1. API Key Management

**Backend Storage:**
- API keys stored in `system_config` table
- Accessible only via Supabase Service Role
- RLS policies prevent client-side access
- Keys marked as encrypted are masked in admin UI

**Access Control:**
```sql
-- Only super admins can view/edit system config
CREATE POLICY "Only super admins can modify system config"
  ON system_config FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
```

**Environment Variables (Edge Functions):**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY  # Full database access
SUPABASE_ANON_KEY          # Public key for client auth
```

### 2. Authentication Flow

```
Client Request
    │
    ├─► JWT Token in Authorization header
    │
    ▼
Edge Function
    │
    ├─► Validate JWT with Supabase Auth
    ├─► Extract user_id from token
    ├─► Check admin role (if required)
    │
    ▼
Rate Limit Check
    │
    ├─► Query user's rate limits
    ├─► Count recent API calls
    ├─► Allow or reject request
    │
    ▼
LLM API Call
    │
    ├─► Fetch system API key (service role)
    ├─► Make external API request
    ├─► Parse response
    │
    ▼
Usage Logging
    │
    ├─► Calculate tokens and cost
    ├─► Insert log (service role)
    └─► Return response to client
```

### 3. Row Level Security (RLS) Policies

**api_usage_logs:**
```sql
-- Users see only their own logs
CREATE POLICY "Users can view own API usage"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins see all logs
CREATE POLICY "Admins can view all API usage"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (is_admin());
```

**rate_limits:**
```sql
-- Users can view their limits
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only admins can modify
CREATE POLICY "Only admins can modify rate limits"
  ON rate_limits FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

## API Endpoints

### 1. LLM Proxy (`/functions/v1/llm-proxy`)

**Purpose:** Secure proxy for all LLM API calls

**Method:** POST

**Authentication:** Required (JWT)

**Request Body:**
```typescript
{
  projectId: string;      // Required: Project ID for tracking
  model?: string;         // Optional: Specific model to use
  prompt: string;         // Required: The prompt to send
  temperature?: number;   // Optional: Default 0.7
  maxTokens?: number;     // Optional: Default 2000
}
```

**Response:**
```typescript
{
  content: string;        // LLM response content
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;          // Model used
}
```

**Error Responses:**
- 401: Unauthorized (missing or invalid JWT)
- 429: Rate limit exceeded
- 500: Internal server error

**Features:**
- Automatic rate limiting
- Usage tracking and cost calculation
- Model selection (default or specified)
- Token counting
- Duration tracking

### 2. Generate Estimate (`/functions/v1/generate-estimate`)

**Purpose:** Generate construction estimates using LLM

**Method:** POST

**Authentication:** Required (JWT)

**Request Body:**
```typescript
{
  projectId: string;           // Required: Project ID
  scenarioType: 'eco' | 'standard' | 'premium';  // Required
}
```

**Response:**
```typescript
{
  estimate: {
    id: string;
    project_id: string;
    scenario_type: string;
    total_amount: number;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    created_at: string;
  };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}
```

**Internal Flow:**
1. Validate user and project ownership
2. Build specialized prompt based on scenario
3. Call llm-proxy internally
4. Parse and validate LLM response
5. Insert estimate into database
6. Return formatted estimate

## Database Schema

### Core Tables

#### system_config
```sql
CREATE TABLE system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  is_encrypted boolean DEFAULT false,
  description text,
  category text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
```

**Key configurations:**
- `openrouter_api_key`: OpenRouter API key
- `default_model`: Default model to use
- `max_tokens_default`: Default max tokens
- `rate_limit_enabled`: Enable/disable rate limiting

#### ai_models
```sql
CREATE TABLE ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model_id text NOT NULL,
  display_name text NOT NULL,
  description text,
  cost_per_1k_tokens_input numeric(10, 6) DEFAULT 0,
  cost_per_1k_tokens_output numeric(10, 6) DEFAULT 0,
  is_active boolean DEFAULT true,
  max_tokens integer DEFAULT 4096,
  capabilities jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider, model_id)
);
```

**Capabilities structure:**
```json
{
  "function_calling": true,
  "vision": false,
  "json_mode": true,
  "streaming": true
}
```

#### subscription_tiers
```sql
CREATE TABLE subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  price_monthly numeric(10, 2) DEFAULT 0,
  price_yearly numeric(10, 2) DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Limits structure:**
```json
{
  "projects_max": 20,
  "estimates_per_month": 100,
  "requests_per_day": 200,
  "tokens_per_month": 500000
}
```

#### api_usage_logs
```sql
CREATE TABLE api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  project_id uuid REFERENCES projects(id),
  model_id uuid REFERENCES ai_models(id),
  provider text NOT NULL,
  endpoint text NOT NULL,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  cost numeric(10, 6) DEFAULT 0,
  duration_ms integer,
  status text NOT NULL,
  error_message text,
  request_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Performance optimization:**
- Index on (user_id, created_at) for user dashboards
- Index on created_at for admin reports
- Consider partitioning by month for large datasets

#### rate_limits
```sql
CREATE TABLE rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id),
  requests_per_minute integer DEFAULT 10,
  requests_per_hour integer DEFAULT 100,
  requests_per_day integer DEFAULT 1000,
  tokens_per_day integer DEFAULT 100000,
  tokens_per_month integer DEFAULT 1000000,
  is_custom boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Rate Limiting Implementation

### Algorithm

```typescript
async function checkRateLimit(supabase, userId): Promise<boolean> {
  // 1. Fetch user's rate limits
  const limits = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!limits) {
    // Use default limits from subscription tier
    return checkSubscriptionLimits(userId);
  }

  // 2. Count requests in time window
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { count } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneDayAgo.toISOString())
    .eq('status', 'success');

  // 3. Check if within limits
  return (count || 0) < limits.requests_per_day;
}
```

### Time Windows

- **Per Minute:** Short-term burst protection
- **Per Hour:** Medium-term abuse prevention
- **Per Day:** Daily quota management
- **Per Month:** Subscription tier enforcement

### Custom Limits

Admins can set custom limits for specific users:
```sql
INSERT INTO rate_limits (user_id, requests_per_day, tokens_per_month, is_custom, notes)
VALUES (
  'user-uuid',
  5000,
  5000000,
  true,
  'Enterprise customer - increased limits'
);
```

## Cost Calculation

### Formula

```typescript
function calculateCost(
  tokensInput: number,
  tokensOutput: number,
  modelConfig: AIModel
): number {
  const inputCost = (tokensInput / 1000) * modelConfig.cost_per_1k_tokens_input;
  const outputCost = (tokensOutput / 1000) * modelConfig.cost_per_1k_tokens_output;

  return inputCost + outputCost;
}
```

### Example Costs

**GPT-4:**
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens
- Example: 1000 input + 500 output = $0.03 + $0.03 = $0.06

**Claude 3.5 Sonnet:**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- Example: 1000 input + 500 output = $0.003 + $0.0075 = $0.0105

### Revenue Calculation

```typescript
// Markup percentage (e.g., 50% markup)
const MARKUP = 0.50;

function calculateRevenue(apiCost: number): number {
  return apiCost * (1 + MARKUP);
}

// Monthly revenue projection
function projectMonthlyRevenue(dailyApiCalls: number, avgCostPerCall: number): number {
  const monthlyCost = dailyApiCalls * 30 * avgCostPerCall;
  const monthlyRevenue = calculateRevenue(monthlyCost);
  return monthlyRevenue;
}
```

## Monetization Strategy

### Subscription Tiers

**Free Tier:**
- 3 projects
- 10 estimates per month
- 50 requests per day
- 50,000 tokens per month
- Basic models only
- Revenue: $0 (user acquisition)

**Starter ($19.99/month):**
- 20 projects
- 100 estimates per month
- 200 requests per day
- 500,000 tokens per month
- All models
- Revenue: $19.99/month

**Pro ($49.99/month):**
- Unlimited projects
- 500 estimates per month
- 1,000 requests per day
- 2M tokens per month
- Premium models
- API access
- Revenue: $49.99/month

**Enterprise ($199.99/month):**
- Everything unlimited
- Dedicated support
- SLA
- Custom integration
- Revenue: $199.99/month + usage overages

### Usage Tracking for Billing

```sql
-- Monthly usage report per user
SELECT
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  SUM(tokens_input + tokens_output) as total_tokens,
  SUM(cost) as total_cost,
  AVG(duration_ms) as avg_duration
FROM api_usage_logs
WHERE status = 'success'
GROUP BY user_id, month
ORDER BY month DESC, total_cost DESC;
```

### Overage Charges

```typescript
// Calculate overage charges
function calculateOverage(
  subscription: SubscriptionTier,
  actualUsage: {
    requests: number;
    tokens: number;
  }
): number {
  const limits = subscription.limits;
  let overageCost = 0;

  // Requests overage
  if (actualUsage.requests > limits.requests_per_day * 30) {
    const extraRequests = actualUsage.requests - (limits.requests_per_day * 30);
    overageCost += extraRequests * 0.01; // $0.01 per extra request
  }

  // Tokens overage
  if (actualUsage.tokens > limits.tokens_per_month) {
    const extraTokens = actualUsage.tokens - limits.tokens_per_month;
    overageCost += (extraTokens / 1000) * 0.002; // $0.002 per 1K extra tokens
  }

  return overageCost;
}
```

## Admin Dashboard Features

### 1. Model Configuration (`/admin/models`)

**Capabilities:**
- Add/edit/delete AI models
- Configure pricing per model
- Enable/disable models
- Set max tokens and capabilities
- View model usage statistics

### 2. System Configuration (`/admin/config`)

**Capabilities:**
- Manage API keys (encrypted storage)
- Configure default settings
- Set global rate limits
- Feature flags
- System-wide parameters

### 3. Usage Analytics (`/admin/usage`)

**Capabilities:**
- Real-time usage logs
- Filter by user, date, status
- Cost breakdown
- Token consumption charts
- Error rate monitoring
- Performance metrics

### 4. Subscription Management (`/admin/subscriptions`)

**Capabilities:**
- Manage subscription tiers
- View active subscriptions
- Handle upgrades/downgrades
- Process refunds
- Set custom pricing

## Security Best Practices

### 1. API Key Rotation

```typescript
// Rotate API keys regularly
async function rotateApiKey(provider: string, newKey: string) {
  await supabase
    .from('system_config')
    .update({
      value: newKey,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId
    })
    .eq('key', `${provider}_api_key`);

  // Log rotation event
  await auditLog('api_key_rotated', { provider });
}
```

### 2. Input Sanitization

```typescript
function sanitizePrompt(prompt: string): string {
  // Remove potential injection attempts
  return prompt
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 10000); // Max prompt length
}
```

### 3. Request Validation

```typescript
function validateRequest(body: any): boolean {
  // Validate required fields
  if (!body.projectId || !body.prompt) {
    throw new Error('Missing required fields');
  }

  // Validate types
  if (typeof body.prompt !== 'string') {
    throw new Error('Invalid prompt type');
  }

  // Validate ranges
  if (body.maxTokens && (body.maxTokens < 1 || body.maxTokens > 10000)) {
    throw new Error('Invalid maxTokens range');
  }

  return true;
}
```

### 4. Audit Logging

```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
```

## Deployment Checklist

### Pre-Production

- [ ] Set all API keys in system_config
- [ ] Configure default subscription tier
- [ ] Create first super admin user
- [ ] Test rate limiting
- [ ] Verify RLS policies
- [ ] Load test Edge Functions
- [ ] Set up monitoring alerts

### Production

- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable real-time monitoring
- [ ] Configure error logging (Sentry)
- [ ] Set up cost alerts
- [ ] Document API for users
- [ ] Create admin training materials

## Monitoring and Alerts

### Key Metrics

```sql
-- Daily API health metrics
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  COUNT(*) FILTER (WHERE status = 'rate_limited') as rate_limited,
  AVG(duration_ms) as avg_duration,
  SUM(cost) as daily_cost
FROM api_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Alert Thresholds

- Error rate > 5%: Warning
- Error rate > 10%: Critical
- Average duration > 5000ms: Warning
- Daily cost > budget: Alert
- Rate limit hit > 100 times/day: Investigate

## Future Enhancements

### Short Term

1. **Caching Layer**
   - Cache common prompts
   - Reduce API costs by 30-40%

2. **Streaming Support**
   - Real-time response streaming
   - Better UX for long responses

3. **Webhook Integration**
   - Notify on estimate completion
   - Integration with other tools

### Long Term

1. **Multi-tenant Support**
   - Team accounts
   - Shared projects
   - Role-based access

2. **Advanced Analytics**
   - Prediction of costs
   - Usage patterns
   - Optimization recommendations

3. **White-label Solution**
   - Custom branding
   - Separate databases
   - Dedicated infrastructure

## Support and Troubleshooting

### Common Issues

**Rate Limit False Positives:**
```sql
-- Check user's actual usage
SELECT COUNT(*) as requests_today
FROM api_usage_logs
WHERE user_id = 'uuid'
  AND created_at >= CURRENT_DATE;
```

**Cost Discrepancies:**
```sql
-- Audit cost calculations
SELECT
  model_id,
  AVG(cost) as avg_cost,
  AVG(tokens_input + tokens_output) as avg_tokens
FROM api_usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY model_id;
```

**Permission Errors:**
```sql
-- Verify admin status
SELECT * FROM admin_users WHERE user_id = 'uuid';
```

## License and Compliance

- Ensure GDPR compliance for user data
- Log retention policy: 90 days default
- API keys encrypted at rest
- PCI DSS if processing payments
- Terms of Service for API usage
